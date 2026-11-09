#!/usr/bin/env python
"""
Finetune Sunflower-Gemma (or any Gemma chat model) for EN->Kenyan MT,
ONE language at a time with LoRA.

Matches your app prompt in convex/translate.ts:
  system: "You are Sunflower, a helpful assistant made by Sunbird AI who knows many African languages."
  user:   "Translate from English to {LangName}: {text}"
  assistant: "{translation}"

Data: accepts any of your repos:
  BlakHasan/kenyan-corpus-{kikuyu,kamba,dholuo,swahili,...}  (source_text/target_text)
  BlakHasan/samiati-{kam,luo,mas,niq,so,sheng}-translation   (source/target)
  BlakHasan/{swa,som,guz,luhya,kln,luo}-augmented-collection  (src/tgt)
  + any michsethowusu / Knox / Rogendo source (auto column-mapped)

Usage (one language per run):
  pip install transformers peft trl datasets evaluate sacrebleu bitsandbytes
  python scripts/finetune_sunflower_mt.py --lang kik --dataset BlakHasan/kenyan-corpus-kikuyu --base-model google/gemma-3-4b-it --max-rows 100000
  python scripts/finetune_sunflower_mt.py --lang swa --dataset BlakHasan/swa-augmented-collection --base-model google/gemma-3-4b-it --push-repo BlakHasan/sunflower-mt-swa

Recommended order: kik (1.9M, forgiving) -> kam (545k) -> luo (304k) -> swa (228k new) -> kln -> mas -> luhya -> som -> guz.
-finetune EN->X only first; add X->EN (swap prompt) once EN->X chrF plateaus.
"""
from __future__ import annotations
import argparse
import pandas as pd

LANG_NAMES = {"kik":"Kikuyu","swa":"Swahili","sw":"Swahili","luo":"Luo","dholuo":"Luo",
 "kln":"Kalenjin","nandi":"Kalenjin","mas":"Maasai","som":"Somali","so":"Somali",
 "luhya":"Luhya","luy":"Luhya","kam":"Kamba","guz":"Gusii","kisii":"Gusii",
 "meru":"Meru","mer":"Meru","embu":"Embu","sheng":"Sheng"}
SYSTEM = "You are Sunflower, a helpful assistant made by Sunbird AI who knows many African languages."

def to_pairs(df: pd.DataFrame, origin: str) -> pd.DataFrame:
    cols = {str(c).lower().strip(): c for c in df.columns}
    def col(*names):
        for n in names:
            if n in cols: return cols[n]
        return None
    src_c = col("source_text","src","source","english","en","eng","premise")
    tgt_c = col("target_text","tgt","target","kikuyu","kik","swahili","sw","dholuo","luo",
                "kalenjin","kln","maasai","mas","somali","som","luhya","luy","kamba","kam",
                "gusii","kisii","meru","embu","hypothesis")
    if src_c is None or tgt_c is None:
        str_cols = list(df.columns)[:2]
        if len(str_cols) == 2: src_c, tgt_c = str_cols
        else: return pd.DataFrame(columns=["src","tgt"])
    out = pd.DataFrame({"src": df[src_c].astype(str), "tgt": df[tgt_c].astype(str)})
    if "similarity" in cols:
        out["similarity"] = pd.to_numeric(df[cols["similarity"]], errors="coerce")
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", required=True, help="kik|swa|luo|kln|mas|som|luhya|kam|guz|meru|sheng...")
    ap.add_argument("--dataset", required=True, help="HF dataset id with train split")
    ap.add_argument("--split", default="train")
    ap.add_argument("--config", default=None, help="dataset config/subset if needed")
    ap.add_argument("--base-model", default="google/gemma-3-4b-it")
    ap.add_argument("--max-rows", type=int, default=100000)
    ap.add_argument("--min-sim", type=float, default=1.0)
    ap.add_argument("--epochs", type=float, default=1.0)
    ap.add_argument("--lr", type=float, default=2e-4)
    ap.add_argument("--batch", type=int, default=4)
    ap.add_argument("--grad-accum", type=int, default=8)
    ap.add_argument("--lora-r", type=int, default=16)
    ap.add_argument("--push-repo", default=None, help="e.g. BlakHasan/sunflower-mt-kik")
    ap.add_argument("--direction", default="en-kik", choices=["en-kik", "kik-en"],
                    help="en-kik (default) or kik-en (Kikuyu->English)")
    ap.add_argument("--dry-run", action="store_true", help="build data + print stats, no training")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    from datasets import load_dataset
    lang_name = LANG_NAMES.get(args.lang, args.lang)
    print(f"Loading {args.dataset} config={args.config} split={args.split} ...")
    kw = {"split": args.split}
    ds = load_dataset(args.dataset, args.config, **kw) if args.config else load_dataset(args.dataset, **kw)
    df = ds.to_pandas() if not getattr(ds, "_ex_iterable", False) else pd.DataFrame(list(ds))
    pairs = to_pairs(df, args.dataset)
    pairs["src"] = pairs["src"].str.strip(); pairs["tgt"] = pairs["tgt"].str.strip()
    pairs = pairs[(pairs.src.str.len()>=3)&(pairs.tgt.str.len()>=3)&(pairs.src.str.len()<2000)&(pairs.tgt.str.len()<2000)]
    if "similarity" in pairs.columns and args.min_sim > 0:
        pairs = pairs[pairs.similarity.fillna(99) >= args.min_sim]
    pairs = pairs.drop_duplicates().reset_index(drop=True)
    if args.max_rows and len(pairs) > args.max_rows:
        pairs = pairs.sample(args.max_rows, random_state=args.seed).reset_index(drop=True)
    print(f"pairs after clean: {len(pairs)}")
    if len(pairs) < 1000:
        print("WARNING: <1k pairs — LoRA will memorize. Add augmented data first.")

    # chat-format with Sunflower template (direction-aware)
    if args.direction == "kik-en":
        def fmt(src, tgt):
            return {"messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": f"Translate from Kikuyu to English: {tgt}"},
                {"role": "assistant", "content": src}]}
    else:
        def fmt(src, tgt):
            return {"messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": f"Translate from English to {lang_name}: {src}"},
                {"role": "assistant", "content": tgt}]}
    chat = pd.DataFrame([fmt(s,t) for s,t in zip(pairs.src, pairs.tgt)])
    test = chat.sample(frac=0.02, random_state=args.seed) if len(chat) > 500 else chat.head(0)
    train = chat.drop(test.index) if len(test) else chat
    print(f"train={len(train)} eval={len(test)}")
    if args.dry_run:
        import json
        print(json.dumps(train.head(1).to_dict(), ensure_ascii=True)[:600])
        return

    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from trl import SFTTrainer, SFTConfig

    tok = AutoTokenizer.from_pretrained(args.base_model)
    if tok.pad_token is None: tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model, torch_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
        load_in_4bit=True, device_map="auto")
    model = prepare_model_for_kbit_training(model)
    peft_cfg = LoraConfig(r=8 if "2b" in args.base_model.lower() or "e2b" in args.base_model.lower() else args.lora_r,
        lora_alpha=32, lora_dropout=0.05, bias="none",
        target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
        task_type="CAUSAL_LM")
    model = get_peft_model(model, peft_cfg)

    from datasets import Dataset
    train_ds = Dataset.from_pandas(train[["messages"]])
    eval_ds = Dataset.from_pandas(test[["messages"]]) if len(test) else None
    sft_args = SFTConfig(output_dir=f"./out-sunflower-mt-{args.lang}", num_train_epochs=args.epochs,
        learning_rate=args.lr, per_device_train_batch_size=args.batch, gradient_accumulation_steps=args.grad_accum,
        logging_steps=50, save_steps=500, eval_strategy="steps" if eval_ds is not None else "no",
        eval_steps=500, bf16=True, optim="paged_adamw_8bit", max_seq_length=1024,
        push_to_hub=bool(args.push_repo), hub_model_id=args.push_repo)
    trainer = SFTTrainer(model=model, train_dataset=train_ds, eval_dataset=eval_ds, args=sft_args)
    trainer.train()
    if args.push_repo:
        trainer.push_to_hub()
        print(f"Pushed adapter -> https://huggingface.co/{args.push_repo}")
    else:
        trainer.save_model(f"./out-sunflower-mt-{args.lang}")
    print("Next: sacrebleu/chrF on FLORES devtest BEFORE swapping Convex URL (convex/translate.ts).")

if __name__ == "__main__":
    main()
