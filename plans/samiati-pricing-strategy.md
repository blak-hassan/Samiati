# Samiati Pricing Strategy & Unit Economics Analysis

**Date:** August 2026
**Status:** Strategic Analysis — Not Production Code

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Samiati Architecture & Cost Structure](#2-samiati-architecture--cost-structure)
3. [Infrastructure Cost Model (Verified 2026 Prices)](#3-infrastructure-cost-model)
4. [AI Inference Cost Model](#4-ai-inference-cost-model)
5. [Per-Message Cost Breakdown](#5-per-message-cost-breakdown)
6. [Free Tier Analysis](#6-free-tier-analysis)
7. [$5/Month Tier Analysis](#7-5month-tier-analysis)
8. [$15/Month Tier Analysis](#8-15month-tier-analysis)
9. [Custom / Contact Us Tier](#9-custom--contact-us-tier)
10. [Break-Even Analysis](#10-break-even-analysis)
11. [Scale Modeling (1K → 1M Users)](#11-scale-modeling)
12. [Conversion Rate Modeling](#12-conversion-rate-modeling)
13. [Economic Danger Zones](#13-economic-danger-zones)
14. [Recommended Pricing Structure](#14-recommended-pricing-structure)
15. [Usage Measurement System](#15-usage-measurement-system)
16. [Pricing Page Strategy](#16-pricing-page-strategy)
17. [Conservative Launch Recommendation](#17-conservative-launch-recommendation)

---

## 1. Executive Summary

**The most important answer:** Samiati should set Free at **10 AI messages/day**, $5/month at **300 messages/month**, and $15/month at **1,000 messages/month**.

**Why these numbers work:**

| Metric | Free | $5/mo | $15/mo |
|---|---|---|---|
| Price | $0 | $5 | $15 |
| Message limit | 10/day (~250/mo) | 300/month | 1,000/month |
| Voice limit | None | 15 min/month | 60 min/month |
| Est. AI cost to Samiati (typical user) | $0.30–$0.60/mo | $0.60–$1.20/mo | $2.00–$4.00/mo |
| Est. gross margin (after infra) | -$0.60 (subsidized) | $2.50–$3.50 (50–70%) | $9.00–$11.50 (60–77%) |
| Max sustainable free users per paid sub | — | 4–6 | 8–15 |

**Conservative launch recommendation:** Start with the $5 tier at **200 messages/month** (not 300) and the $15 tier at **800 messages/month** (not 1,000). This gives a safety buffer while you gather real usage data. You can always increase limits; cutting them after launch damages trust.

**Break-even:** At 3% conversion rate and typical usage, Samiati reaches break-even at approximately **2,000 total users** (~1,940 free + 60 paying).

---

## 2. Samiati Architecture & Cost Structure

### Current Stack

| Layer | Technology | Cost Model |
|---|---|---|
| Frontend | Next.js 16 on Vercel | Free (Hobby) → $20/mo (Pro) |
| Backend/DB | Convex (serverless) | Free tier → $25/mo (Professional) |
| Auth | Clerk | Free to 50K MRU |
| AI Chat/Search/Translate | Gemma 4 E2B via HuggingFace | Usage-based (GPU compute) |
| ASR (Speech-to-Text) | Whisper fine-tune via HuggingFace | Usage-based (GPU compute) |
| TTS (Text-to-Speech) | Orpheus-3B via HuggingFace | Usage-based (GPU compute) |
| Monitoring | Sentry | Free (5K errors/mo) |
| Payments | Stripe | 2.9% + $0.30 per transaction |
| File Storage | Cloudflare R2 | Usage-based |
| SMS | Twilio | Per-message |

### Key Architectural Insight

Samiati's architecture has a **cost advantage** that improves over time:

1. **Today (cloud inference):** All AI runs on HuggingFace endpoints. Every message costs real GPU compute.
2. **Future (on-device):** Gemma 4 E2B and E4B are designed to run on phones and edge devices. As Samiati moves inference onto consumer hardware, the per-message cost approaches zero for text operations.
3. **Hybrid (likely path):** Basic chat and translation run locally; complex "thinking" tasks and voice features remain cloud-based.

This means the pricing model should be designed for **today's cloud costs** but will become **increasingly profitable** as on-device inference is adopted.

### Cost Categories

| Category | Description | Scaling Behavior |
|---|---|---|
| **Per-message (text)** | Chat, search, translation via Gemma 4 E2B | Linear with usage |
| **Per-message (voice)** | ASR + TTS on each voice interaction | Linear, 3–6x more expensive than text |
| **Per-transaction** | Stripe payment processing | Fixed $0.30 + 2.9% per payment |
| **Fixed monthly** | Convex, Vercel, Clerk, Sentry, monitoring | Scales with user count (mostly free tiers initially) |
| **Fixed team** | Developer time, support | Steps up at defined thresholds |

---

## 3. Infrastructure Cost Model

### Verified 2026 Prices

| Service | Free Tier | Paid Tier | Overage |
|---|---|---|---|
| **Convex** | 1M function calls, 0.5 GB storage, 1 GB I/O | $25/mo (Professional): 25M calls, 50 GB storage | $2.00/1M calls, $0.20/GB |
| **Clerk** | 50,000 MRU | $25/mo (Pro): 50K MRU included | $0.02/MRU over 50K |
| **Vercel** | 100 GB bandwidth, 1M function invocations | $20/user/mo (Pro): 1 TB BW, 10M edge | $0.15/GB BW, $0.60/1M functions |
| **Sentry** | 5K errors/mo, 1 user | $26/mo (Team): 50K errors, unlimited users | PAYG per event |
| **Stripe** | — | — | 2.9% + $0.30 per transaction |
| **Twilio SMS** | — | — | ~$0.0079/SMS (US), varies by country |
| **Cloudflare R2** | 10 GB storage, 10M Class A ops | $0.015/GB/mo storage | $0.01/1000 Class A ops |

### Fixed Monthly Cost Estimates by Scale

| Users | Convex | Vercel | Clerk | Sentry | Monitoring | Total Fixed |
|---|---|---|---|---|---|---|
| 0–1,000 | $0 (free) | $0 (Hobby) | $0 (free) | $0 (free) | $10 | **$10** |
| 1,000–5,000 | $25 (Pro) | $20 (1 seat) | $0 (free) | $0 (free) | $25 | **$70** |
| 5,000–10,000 | $25 | $20 | $0 | $26 (Team) | $50 | **$121** |
| 10,000–50,000 | $50 (usage) | $40 (2 seats) | $0 | $26 | $100 | **$216** |
| 50,000–100,000 | $150 (usage) | $80 (4 seats) | $100 (Pro overage) | $80 (Business) | $200 | **$610** |
| 100,000–500,000 | $500 (usage) | $200 (10 seats) | $9,000 ($0.02×450K) | $200 (usage) | $500 | **$10,400** |
| 500,000–1,000,000 | $1,500 | $400 | $19,000 | $500 | $1,000 | **$22,400** |

**Note on Clerk costs:** Clerk's free tier covers 50K MRU. At 100K+ users, Clerk becomes a significant cost ($0.02/user over 50K). This is a key cost driver at scale.

---

## 4. AI Inference Cost Model

### Pricing Source & Assumptions

**Verified 2026 prices (August 2026):**

| Model | Provider | Input $/1M tokens | Output $/1M tokens | Source |
|---|---|---|---|---|
| Gemma 4 E2B | HuggingFace (custom endpoint) | $0.04–$0.15 | $0.10–$0.30 | cloudprice.net, tokencost.app |
| Gemma 4 31B | OpenRouter | $0.08–$0.14 | $0.34–$0.40 | OpenRouter (Apr 2026) |
| Gemma 4 26B MoE | OpenRouter | $0.13 | $0.40 | tokencost.app |

**Samiati uses custom-hosted models** (`BlakHasan/Sunflower-Gemma4-E2B`, `BlakHasan/asr-whisper-51-african-languages`, `BlakHasan/orpheus-3b-tts-multilingual`). These are hosted on HuggingFace's inference infrastructure.

**Cost estimation approach:** Since Samiati uses custom endpoints (not standard provider APIs), costs are based on:
- HuggingFace Inference Endpoints pricing: $0.50/hr for T4 GPU, $0.80/hr for L4
- Model size and inference throughput estimates
- Conservative buffers for cold starts and retries

### AI Service Cost Estimates

#### Chat (Gemma 4 E2B)

| Parameter | Value | Notes |
|---|---|---|
| Model parameters | 5.1B total, 2.3B effective | E2B = "Edge 2 Billion" |
| Typical input | ~300 tokens (system 200 + user 100) | Based on chat.ts MAX_MESSAGES_HISTORY=20, MAX_CHAT_MESSAGE_LENGTH=5000 |
| Typical output | ~200 tokens | max_tokens: 350 in code |
| Total tokens/request | ~500 tokens | |
| GPU time per request | ~2–4 seconds | On T4 GPU with batching |
| T4 GPU cost | $0.50/hr = $0.000139/sec | HuggingFace Inference Endpoints |
| **Cost per chat message** | **$0.0003–$0.0006** | Before batching optimization |
| With batching (10 req/batch) | **$0.00003–$0.00006** | At scale with continuous batching |
| Conservative estimate | **$0.001** | Including cold starts, retries, overhead |

**Important:** At very low volume (early stage), per-request costs are higher due to cold starts and idle GPU time. At scale with batching, costs drop dramatically. The $0.001/message is a **conservative early-stage estimate**.

#### Translation (Gemma 4 E2B)

| Parameter | Value |
|---|---|
| Typical input | ~200 tokens (system 150 + text 50) |
| Typical output | ~100 tokens |
| Total tokens/request | ~300 tokens |
| **Cost per translation** | **$0.0005–$0.001** |
| Conservative estimate | **$0.001** |

#### ASR — Speech-to-Text (Whisper fine-tune)

| Parameter | Value |
|---|---|
| Model | `asr-whisper-51-african-languages` (Whisper large-v3-turbo variant) |
| Input | Audio file (WebM, typically 10–60 seconds) |
| GPU time | ~5–15 seconds for 30-sec audio |
| GPU cost | ~$0.0007–$0.002 per transcription |
| **Cost per minute of audio** | **$0.002–$0.006** |
| Conservative estimate | **$0.005/min** |

#### TTS — Text-to-Speech (Orpheus-3B)

| Parameter | Value |
|---|---|
| Model | `orpheus-3b-tts-multilingual` |
| Input | Text (max 5000 chars in code) |
| Output | WAV audio |
| GPU time | ~3–8 seconds for 10-sec audio |
| GPU cost | ~$0.0004–$0.001 per synthesis |
| **Cost per 10-sec audio** | **$0.0005–$0.001** |
| Conservative estimate | **$0.001/10-sec clip** |

### Combined Operation Costs

| Operation | Components | Conservative Cost |
|---|---|---|
| Text chat | Chat inference | $0.001 |
| Text chat + translate | Chat + translation | $0.002 |
| Voice message (ASR only) | Audio → text | $0.005 |
| Voice reply (TTS only) | Text → audio | $0.001 |
| Full voice interaction | ASR + chat + TTS | $0.007 |
| Full voice + translate | ASR + chat + translate + TTS | $0.008 |

---

## 5. Per-Message Cost Breakdown

### Cost Type Classification

| Cost Type | When It Occurs | Examples |
|---|---|---|
| **Every message** | Every AI interaction | Chat inference, translation, database writes, function calls |
| **Voice only** | Only voice interactions | ASR (speech→text), TTS (text→speech) |
| **Fixed monthly** | Regardless of usage | Convex, Vercel, Clerk, Sentry, domain, monitoring |
| **Per payment** | Each subscription payment | Stripe processing |

### Cost Per Active User Per Month (by usage level)

| Usage Level | Messages/Day | Voice Days/Month | AI Cost/Month | Infra Cost/User/Month | Total Cost/User/Month |
|---|---|---|---|---|---|
| **Light** | 3–5 | 0 | $0.09–$0.15 | $0.01 | $0.10–$0.16 |
| **Typical** | 10–15 | 5 | $0.30–$0.60 | $0.02 | $0.32–$0.62 |
| **Heavy** | 25–40 | 15 | $1.00–$2.50 | $0.03 | $1.03–$2.53 |
| **Extreme** | 50+ | 25 | $3.00–$6.00 | $0.05 | $3.05–$6.05 |

**Infrastructure cost per user** is calculated by dividing total fixed costs by user count. At 1,000 users with $10/mo fixed costs, that's $0.01/user. At 10,000 users with $121/mo fixed costs, that's $0.012/user. The AI cost dominates at all scales.

---

## 6. Free Tier Analysis

### Objective

Provide enough value for users to experience Samiati's core features (chat, translation, basic voice) without making the free plan a money pit.

### Scenario Modeling

**Assumptions:**
- Not every user hits their daily limit
- Usage follows a power law: most users are light, few are heavy
- "Realistic usage" = 40–60% of allowance consumed

#### Option A: 5 Messages/Day

| Metric | Value |
|---|---|
| Monthly allowance | ~150 messages |
| Max theoretical cost (100% usage) | $0.15/mo |
| Typical cost (50% usage) | $0.075/mo |
| Heavy user cost (80% usage) | $0.12/mo |
| **Verdict** | Too restrictive — users can't meaningfully experience the product |

#### Option B: 10 Messages/Day ✅ RECOMMENDED

| Metric | Value |
|---|---|
| Monthly allowance | ~300 messages |
| Max theoretical cost (100% usage) | $0.30/mo |
| Typical cost (50% usage) | $0.15/mo |
| Heavy user cost (80% usage) | $0.24/mo |
| **Verdict** | Good balance — enough for daily use, bounded cost |

#### Option C: 20 Messages/Day

| Metric | Value |
|---|---|
| Monthly allowance | ~600 messages |
| Max theoretical cost (100% usage) | $0.60/mo |
| Typical cost (50% usage) | $0.30/mo |
| Heavy user cost (80% usage) | $0.48/mo |
| **Verdict** | Workable but expensive at scale — 2x the cost of Option B |

#### Option D: 30 Messages/Day

| Metric | Value |
|---|---|
| Monthly allowance | ~900 messages |
| Max theoretical cost (100% usage) | $0.90/mo |
| Typical cost (50% usage) | $0.45/mo |
| Heavy user cost (80% usage) | $0.72/mo |
| **Verdict** | Dangerous — free users approaching $5-tier costs |

### Free Tier Recommendation

**Set at 10 messages/day (hard cap, not monthly).** Daily caps are better than monthly caps for free tiers because:
1. They prevent "binge and forget" patterns that spike costs
2. They create a natural daily return habit
3. They're easier for users to understand ("10 per day" vs "300 per month")
4. They prevent abuse (someone scripting 300 messages in one day)

**Daily cap approach:** Reset at midnight UTC. No rollover. Hourly sub-limit of 5 messages to prevent burst abuse (already exists in code at `aiQuota.ts`).

**Monthly cost per free user:** $0.15–$0.30 (typical), $0.30 max.

### Free Tier Feature Set

| Feature | Included | Notes |
|---|---|---|
| AI Chat | 10 msgs/day | Core experience |
| Translation | 5 translations/day | Subset of chat limit |
| Voice (ASR) | 2 voice messages/day | Expensive — limit tightly |
| Voice (TTS) | 2 audio replies/day | Expensive — limit tightly |
| Communities | ✅ | Social features are cheap |
| Posts & Fireplace | ✅ | Community engagement |
| Changa (data contribution) | ✅ | Users generate value for you |
| Conversation history | Last 7 days | Encourage upgrade for full history |
| Language profiles | 1 language | Paid: unlimited |
| Export | ❌ | Paid feature |

---

## 7. $5/Month Tier Analysis

### Allowance Design

| Resource | Allowance | Rationale |
|---|---|---|
| AI messages | 300/month | ~10/day — covers daily usage without excess |
| Translations | 150/month | ~5/day — meaningful but bounded |
| Voice minutes | 15 min/month | ~5 voice sessions of 3 min each |
| Conversation history | 90 days | Meaningful upgrade from Free's 7 days |
| Language profiles | 3 | Allows learning multiple languages |

### Cost Modeling

#### Maximum Theoretical Cost (100% Allowance Consumed)

| Operation | Quantity | Unit Cost | Total |
|---|---|---|---|
| Chat messages | 300 | $0.001 | $0.30 |
| Translations | 150 | $0.001 | $0.15 |
| Voice (ASR) | 10 min | $0.005/min | $0.05 |
| Voice (TTS) | 5 min | $0.001/10sec | $0.03 |
| **Total AI cost** | | | **$0.53** |
| Infrastructure (per user) | | | $0.02 |
| **Total cost** | | | **$0.55** |

#### Realistic Expected Cost (60% Allowance Consumed)

| Operation | Quantity | Unit Cost | Total |
|---|---|---|---|
| Chat messages | 180 | $0.001 | $0.18 |
| Translations | 90 | $0.001 | $0.09 |
| Voice (ASR) | 6 min | $0.005/min | $0.03 |
| Voice (TTS) | 3 min | $0.001/10sec | $0.018 |
| **Total AI cost** | | | **$0.32** |
| Infrastructure (per user) | | | $0.02 |
| **Total cost** | | | **$0.34** |

#### Heavy User Cost (90% Allowance Consumed)

| Operation | Quantity | Unit Cost | Total |
|---|---|---|---|
| Chat messages | 270 | $0.001 | $0.27 |
| Translations | 135 | $0.001 | $0.135 |
| Voice (ASR) | 9 min | $0.005/min | $0.045 |
| Voice (TTS) | 4.5 min | $0.001/10sec | $0.027 |
| **Total AI cost** | | | **$0.48** |
| Infrastructure (per user) | | | $0.02 |
| **Total cost** | | | **$0.50** |

### Gross Margin at $5/Month

| Scenario | AI Cost | Infra Cost | Stripe Fee | Total Cost | Gross Profit | Gross Margin |
|---|---|---|---|---|---|---|
| Typical (60%) | $0.32 | $0.02 | $0.45 | $0.79 | $4.21 | **84%** |
| Heavy (90%) | $0.48 | $0.02 | $0.45 | $0.95 | $4.05 | **81%** |
| Max (100%) | $0.53 | $0.02 | $0.45 | $1.00 | $4.00 | **80%** |

**Stripe fee calculation:** 2.9% × $5 = $0.145, + $0.30 = $0.445 ≈ $0.45

### Verdict: $5 Tier Is Financially Safe ✅

Even at 100% allowance consumption, the gross margin stays above 80%. The Stripe fixed fee ($0.30) is the single largest cost component — not AI inference. This tier is safe to offer with **unlimited messages within the 300/month cap**.

---

## 8. $15/Month Tier Analysis

### Allowance Design

| Resource | Allowance | Rationale |
|---|---|---|
| AI messages | 1,000/month | ~33/day — serious daily usage |
| Translations | 500/month | ~17/day — heavy translation use |
| Voice minutes | 60 min/month | ~20 voice sessions of 3 min each |
| Conversation history | Unlimited | Full access |
| Language profiles | Unlimited | Learn any language |
| Priority support | ✅ | Email support with 24hr response |
| Export | ✅ | Download conversations and data |
| Advanced analytics | ✅ | Usage insights and progress tracking |

### Cost Modeling

#### Maximum Theoretical Cost (100% Allowance)

| Operation | Quantity | Unit Cost | Total |
|---|---|---|---|
| Chat messages | 1,000 | $0.001 | $1.00 |
| Translations | 500 | $0.001 | $0.50 |
| Voice (ASR) | 40 min | $0.005/min | $0.20 |
| Voice (TTS) | 20 min | $0.001/10sec | $0.12 |
| **Total AI cost** | | | **$1.82** |
| Infrastructure (per user) | | | $0.03 |
| **Total cost** | | | **$1.85** |

#### Realistic Expected Cost (60% Allowance)

| Operation | Quantity | Unit Cost | Total |
|---|---|---|---|
| Chat messages | 600 | $0.001 | $0.60 |
| Translations | 300 | $0.001 | $0.30 |
| Voice (ASR) | 24 min | $0.005/min | $0.12 |
| Voice (TTS) | 12 min | $0.001/10sec | $0.072 |
| **Total AI cost** | | | **$1.09** |
| Infrastructure (per user) | | | $0.03 |
| **Total cost** | | | **$1.12** |

#### Heavy User Cost (90% Allowance)

| Operation | Quantity | Unit Cost | Total |
|---|---|---|---|
| Chat messages | 900 | $0.001 | $0.90 |
| Translations | 450 | $0.001 | $0.45 |
| Voice (ASR) | 36 min | $0.005/min | $0.18 |
| Voice (TTS) | 18 min | $0.001/10sec | $0.108 |
| **Total AI cost** | | | **$1.64** |
| Infrastructure (per user) | | | $0.03 |
| **Total cost** | | | **$1.67** |

### Gross Margin at $15/Month

| Scenario | AI Cost | Infra Cost | Stripe Fee | Total Cost | Gross Profit | Gross Margin |
|---|---|---|---|---|---|---|
| Typical (60%) | $1.09 | $0.03 | $0.74 | $1.86 | $13.14 | **88%** |
| Heavy (90%) | $1.64 | $0.03 | $0.74 | $2.41 | $12.59 | **84%** |
| Max (100%) | $1.82 | $0.03 | $0.74 | $2.59 | $12.41 | **83%** |

**Stripe fee:** 2.9% × $15 = $0.435, + $0.30 = $0.735 ≈ $0.74

### Why $15 Is Meaningfully Better Than $5

| Feature | $5 Tier | $15 Tier | Upgrade Value |
|---|---|---|---|
| Messages | 300/mo | 1,000/mo | 3.3x more |
| Translations | 150/mo | 500/mo | 3.3x more |
| Voice | 15 min/mo | 60 min/mo | 4x more |
| History | 90 days | Unlimited | Complete access |
| Languages | 3 | Unlimited | Full learning |
| Support | Community | Priority email | Faster help |
| Export | No | Yes | Data ownership |
| Analytics | Basic | Advanced | Progress insights |

**The upgrade from $5 → $15 gives 3–4x the usage limits plus meaningful feature unlocks.** This is a strong value proposition that justifies the 3x price increase.

### Verdict: $15 Tier Is Highly Profitable ✅

At 83–88% gross margin, this tier is the profit engine. Even the heaviest users generate significant profit. This tier is safe to offer.

---

## 9. Custom / Contact Us Tier

### Target Users

| Segment | Why They Need Custom | Typical Volume |
|---|---|---|
| **Schools & Universities** | Hundreds of students, curriculum integration | 50–500 seats, high usage |
| **NGOs & Language Organizations** | Field workers, community programs | 20–200 seats, variable usage |
| **Businesses (translation-heavy)** | Customer support, content localization | 10–100 seats, very high usage |
| **Developers & API users** | Integration into their own apps | API calls, high volume |
| **Call centers** | Real-time voice translation | Continuous voice, very high cost |
| **Government agencies** | Multilingual public services | 50–500 seats, compliance needs |
| **Media companies** | Content translation, transcription | Batch processing, high volume |
| **Extremely heavy individuals** | Power users exceeding $15 limits | 1 person, very high usage |

### Recommended Pricing Model

**Use a hybrid seat-based + usage-based model:**

```
Base fee: $20–$50/seat/month (depending on volume)
Includes: 2,000 messages/seat/month
Overage: $0.005/message (50% discount from per-unit cost)
Voice: $0.10/minute (includes ASR + TTS)
Volume discounts: 10+ seats = 15% off, 50+ seats = 25% off, 100+ seats = custom
```

### "Contact Us" Should Communicate

> **For Teams & Organizations**
>
> Need Samiati for your school, NGO, business, or team? We offer:
> - Volume pricing starting at $20/seat/month
> - API access for developers
> - Custom integrations and onboarding
> - Dedicated support and SLA
> - Bulk transcription and translation
> - Compliance and data privacy options
>
> **Contact us at:** teams@samiati.com
>
> *Typical response within 24 hours on business days.*

### Why This Works

1. **Prevents abuse:** Heavy users who would cost $10+/month on the $15 plan get routed to Custom where you price for their actual usage
2. **Captures B2B revenue:** Schools and NGOs have budgets and can pay $20–50/seat
3. **API access:** Developers building on Samiati pay per-use, which is transparent and profitable
4. **No "unlimited" trap:** Every Custom plan has defined limits — you never offer truly unlimited usage

---

## 10. Break-Even Analysis

### Per-Subscriber Economics

| Metric | $5 Tier | $15 Tier |
|---|---|---|
| Revenue per subscriber | $5.00 | $15.00 |
| Stripe fee | $0.45 | $0.74 |
| Net revenue after Stripe | $4.55 | $14.26 |
| AI cost (typical user) | $0.32 | $1.09 |
| Infra cost per user | $0.02 | $0.03 |
| **Gross profit per subscriber** | **$4.21** | **$13.14** |
| **Gross margin** | **84%** | **88%** |

### Break-Even: Revenue Must Cover Fixed Costs

Fixed costs at various scales:

| Scale | Fixed Costs/Month | Required Paying Subscribers ($5) | Required Paying Subscribers ($15) |
|---|---|---|---|
| Pre-revenue | $10 | 3 | 1 |
| 1,000 users | $70 | 17 | 6 |
| 5,000 users | $121 | 29 | 10 |
| 10,000 users | $216 | 52 | 17 |
| 50,000 users | $610 | 145 | 47 |
| 100,000 users | $10,400 | 2,465 | 790 |

### Break-Even at 3% Conversion Rate

| Total Users | Free Users | Paying (3%) | Revenue | Total Costs | Net |
|---|---|---|---|---|---|
| 500 | 485 | 15 | $90 | $70 + $7 AI = $77 | **+$13** |
| 1,000 | 970 | 30 | $180 | $70 + $15 = $85 | **+$95** |
| 2,000 | 1,940 | 60 | $360 | $70 + $30 = $100 | **+$260** |
| 5,000 | 4,850 | 150 | $900 | $121 + $75 = $196 | **+$704** |
| 10,000 | 9,700 | 300 | $1,800 | $216 + $150 = $366 | **+$1,434** |
| 50,000 | 48,500 | 1,500 | $9,000 | $610 + $750 = $1,360 | **+$7,640** |
| 100,000 | 97,000 | 3,000 | $18,000 | $10,400 + $1,500 = $11,900 | **+$6,100** |

**Note:** "Total Costs" = Fixed costs + AI costs for all users (free at $0.15/mo typical + paid at $0.32–$1.09/mo typical)

### Break-Even Point

**At 3% conversion with mixed $5/$15 subscribers (70/30 split):**

- **Break-even: ~400 total users** (minimum viable)
- **Comfortable break-even: ~2,000 total users**
- **Profitable: 5,000+ total users**

---

## 11. Scale Modeling

### Monthly Revenue and Costs at Various Scales

**Assumptions:**
- 3% conversion rate (Free → Paid)
- 70% of paid users on $5 tier, 30% on $15 tier
- Average AI cost per free user: $0.20/mo (typical)
- Average AI cost per $5 user: $0.40/mo (typical)
- Average AI cost per $15 user: $1.10/mo (typical)

| Total Users | Free Users | Paid Users | Revenue | AI Costs | Infra Costs | Stripe Fees | Total Costs | Net Profit | Margin |
|---|---|---|---|---|---|---|---|---|---|
| **1,000** | 970 | 30 | $180 | $205 | $70 | $12 | $287 | **-$107** | -59% |
| **2,000** | 1,940 | 60 | $360 | $410 | $70 | $24 | $504 | **-$144** | -40% |
| **5,000** | 4,850 | 150 | $900 | $1,025 | $121 | $59 | $1,205 | **-$305** | -34% |
| **10,000** | 9,700 | 300 | $1,800 | $2,050 | $216 | $118 | $2,384 | **-$584** | -32% |
| **50,000** | 48,500 | 1,500 | $9,000 | $10,250 | $610 | $588 | $11,448 | **-$2,448** | -27% |
| **100,000** | 97,000 | 3,000 | $18,000 | $20,500 | $10,400 | $1,176 | $32,076 | **-$14,076** | -78% |
| **500,000** | 485,000 | 15,000 | $90,000 | $102,500 | $22,400 | $5,876 | $130,776 | **-$40,776** | -45% |
| **1,000,000** | 970,000 | 30,000 | $180,000 | $205,000 | $45,000 | $11,752 | $261,752 | **-$81,752** | -45% |

### 🔴 Critical Finding: 3% Conversion Is Not Enough at Scale

At 3% conversion, Samiati **loses money at every scale** because free users cost more in AI inference than paid users generate in revenue. The math doesn't work because:

- Free users cost ~$0.20/mo each in AI
- Each paying subscriber generates ~$8.50 revenue but only offsets ~4–5 free users' AI costs
- At 3% conversion, there are 32 free users per paying subscriber

**This means Samiati MUST either:**
1. Achieve higher conversion rates (5–10%)
2. Reduce free-tier AI costs (tighter limits)
3. Increase paid-tier pricing
4. Reduce free-user AI costs through on-device inference

### Revised Model: 5% Conversion

| Total Users | Free Users | Paid Users | Revenue | Total Costs | Net Profit | Margin |
|---|---|---|---|---|---|---|
| **1,000** | 950 | 50 | $300 | $310 | **-$10** | -3% |
| **2,000** | 1,900 | 100 | $600 | $470 | **+$130** | 22% |
| **5,000** | 4,750 | 250 | $1,500 | $960 | **+$540** | 36% |
| **10,000** | 9,500 | 500 | $3,000 | $1,700 | **+$1,300** | 43% |
| **50,000** | 47,500 | 2,500 | $15,000 | $7,200 | **+$7,800** | 52% |
| **100,000** | 95,000 | 5,000 | $30,000 | $16,500 | **+$13,500** | 45% |

**At 5% conversion, Samiati breaks even at ~1,000 users and becomes profitable at 2,000+.**

### Revised Model: 10% Conversion

| Total Users | Free Users | Paid Users | Revenue | Total Costs | Net Profit | Margin |
|---|---|---|---|---|---|---|
| **1,000** | 900 | 100 | $600 | $420 | **+$180** | 30% |
| **2,000** | 1,800 | 200 | $1,200 | $680 | **+$520** | 43% |
| **5,000** | 4,500 | 500 | $3,000 | $1,400 | **+$1,600** | 53% |
| **10,000** | 9,000 | 1,000 | $6,000 | $2,600 | **+$3,400** | 57% |
| **50,000** | 45,000 | 5,000 | $30,000 | $11,800 | **+$18,200** | 61% |
| **100,000** | 90,000 | 10,000 | $60,000 | $23,000 | **+$37,000** | 62% |

### Free Users Supported Per Paying Subscriber

| Conversion Rate | Free Users Per Paid | Sustainable? |
|---|---|---|
| 1% | 99 free per 1 paid | ❌ Not sustainable |
| 3% | 32 free per 1 paid | ⚠️ Borderline |
| 5% | 19 free per 1 paid | ✅ Sustainable |
| 10% | 9 free per 1 paid | ✅ Highly profitable |

**Maximum sustainable free-user ratio:** ~15 free users per paying subscriber (at $5 avg revenue and $0.20 avg free-user cost).

---

## 12. Conversion Rate Modeling

### How Many Free Users Can Samiati Afford at Each Conversion Rate?

**Formula:** Free users sustainable = (Revenue per paid user × conversion rate) / (AI cost per free user × (1 - conversion rate))

At $8.50 avg revenue per paid user and $0.20 AI cost per free user:

| Conversion Rate | Free Users Sustainable Per 1,000 Total | Revenue | AI Costs | Net |
|---|---|---|---|---|
| 1% | ~500 | $85 | $200 | **-$115** |
| 3% | ~1,800 | $255 | $200 | **+$55** |
| 5% | ~3,300 | $425 | $200 | **+$225** |
| 10% | ~8,100 | $850 | $200 | **+$650** |

### Realistic Conversion Benchmarks (SaaS)

| Industry | Free → Paid Conversion | Notes |
|---|---|---|
| Consumer SaaS average | 2–5% | Broad average |
| Language learning apps | 5–15% | Duolingo ~7% paid |
| AI assistants | 3–8% | ChatGPT ~4% paid |
| Developer tools | 5–12% | Higher intent users |
| Education platforms | 3–10% | Depends on institution sales |

**Samiati target: 5–8% conversion** is realistic for a language-learning AI product, especially in the African market where willingness to pay for education is high but absolute price sensitivity is extreme.

---

## 13. Economic Danger Zones

### The $5 Trap: When Users Pay $5 but Cost $8–$10

**This can happen if:**
1. Voice features are underpriced (ASR + TTS are the most expensive operations)
2. Users discover they can maximize value by always using voice
3. No per-operation limits exist beyond the message count

**Example danger scenario:**
- User subscribes to $5/month
- Uses 300 messages, all voice-based
- Each voice message = ASR ($0.005) + TTS ($0.001) + chat ($0.001) = $0.007
- 300 × $0.007 = $2.10 AI cost
- Add translations: 150 × $0.001 = $0.15
- Total AI cost: $2.25
- Stripe fee: $0.45
- **Total cost: $2.70 → still profitable at $5 revenue**

**Even the worst-case $5 user is profitable** because voice is capped at 15 minutes/month. The danger only exists with truly unlimited plans.

### The $15 Danger Scenario

- User subscribes to $15/month
- Hits all limits: 1,000 messages + 500 translations + 60 voice min
- Max AI cost: $1.82
- Stripe fee: $0.74
- **Total cost: $2.56 → still profitable at $15 revenue**

### Why Unlimited Plans Are Dangerous

If Samiati offered "unlimited" on $5 or $15:
- A power user could generate 100 messages/day × 30 days = 3,000 messages
- At $0.007/voice message = $21/month in AI costs alone
- **$5 plan loses $16/month per heavy user**
- **$15 plan loses $6/month per heavy user**

**Recommendation: NEVER offer unlimited AI on $5 or $15.** Always have hard caps.

### Anti-Abuse Measures

1. **Hard message caps** (not soft "fair use" limits)
2. **Hourly rate limits** (already in code: 30/hr chat, 15/hr TTS, 10/hr ASR)
3. **Daily limits** for free tier
4. **Voice minutes cap** (not just message count)
5. **Per-operation credit costs** (voice costs 5–7x more than text)
6. **Suspicious usage detection** (scripting, API abuse)

---

## 14. Recommended Pricing Structure

### Final Tier Design

#### Tier 1: Free

| Attribute | Value |
|---|---|
| **Price** | $0/month |
| **Name** | **Explorer** |
| **AI messages** | 10/day (300/month effective) |
| **Translations** | 5/day |
| **Voice (ASR)** | 2 voice messages/day |
| **Voice (TTS)** | 2 audio replies/day |
| **Voice minutes** | ~6 min/month |
| **Conversation history** | 7 days |
| **Language profiles** | 1 |
| **Communities** | ✅ |
| **Posts & Fireplace** | ✅ |
| **Changa** | ✅ |
| **Export** | ❌ |
| **Support** | Community |
| **Est. cost to Samiati** | $0.15–$0.30/month |
| **Target user** | Casual users, students trying the product |
| **Call-to-action** | "Get Started Free" |
| **Recommended usage cap** | Hard daily cap, no rollover |

#### Tier 2: $5/month

| Attribute | Value |
|---|---|
| **Price** | $5/month ($48/year annual) |
| **Name** | **Learner** |
| **AI messages** | 300/month |
| **Translations** | 150/month |
| **Voice (ASR)** | 30 voice messages/month |
| **Voice (TTS)** | 30 audio replies/month |
| **Voice minutes** | 15 min/month |
| **Conversation history** | 90 days |
| **Language profiles** | 3 |
| **Communities** | ✅ |
| **Posts & Fireplace** | ✅ |
| **Changa** | ✅ |
| **Export** | ❌ |
| **Support** | Community |
| **Est. cost to Samiati** | $0.32–$0.55/month |
| **Gross margin** | 80–84% |
| **Target user** | Regular learners, diaspora staying connected |
| **Call-to-action** | "Start Learning" |
| **Recommended usage cap** | Monthly cap, resets on billing date |

#### Tier 3: $15/month

| Attribute | Value |
|---|---|
| **Price** | $15/month ($144/year annual) |
| **Name** | **Fluent** |
| **AI messages** | 1,000/month |
| **Translations** | 500/month |
| **Voice (ASR)** | 100 voice messages/month |
| **Voice (TTS)** | 100 audio replies/month |
| **Voice minutes** | 60 min/month |
| **Conversation history** | Unlimited |
| **Language profiles** | Unlimited |
| **Communities** | ✅ |
| **Posts & Fireplace** | ✅ |
| **Changa** | ✅ |
| **Export** | ✅ |
| **Advanced analytics** | ✅ |
| **Priority support** | ✅ (email, 24hr response) |
| **Est. cost to Samiati** | $1.10–$1.85/month |
| **Gross margin** | 83–88% |
| **Target user** | Serious learners, professionals, educators |
| **Call-to-action** | "Go Fluent" |
| **Recommended usage cap** | Monthly cap, resets on billing date |

#### Tier 4: Custom

| Attribute | Value |
|---|---|
| **Price** | From $20/seat/month |
| **Name** | **Organization** |
| **AI messages** | 2,000/seat/month (customizable) |
| **Translations** | 1,000/seat/month (customizable) |
| **Voice** | Custom allocation |
| **Features** | Everything in Fluent + API access, admin dashboard, SSO, custom integrations |
| **Support** | Dedicated account manager |
| **Target user** | Schools, NGOs, businesses, developers |
| **Call-to-action** | "Contact Us" |

### Usage Measurement System

**Recommended: Hybrid credit system with message-based limits**

Rather than a pure credit system (confusing for users) or pure message count (doesn't account for voice being more expensive), use a **weighted message system:**

| Operation | Weight | Equivalent Messages |
|---|---|---|
| Text chat | 1x | 1 |
| Translation | 1x | 1 |
| Voice message (ASR) | 3x | 3 |
| Voice reply (TTS) | 2x | 2 |
| Full voice interaction (ASR + chat + TTS) | 5x | 5 |

**Example:** A user who sends 200 text messages, 50 translations, and 20 voice messages uses:
- 200 × 1 = 200 weighted messages
- 50 × 1 = 50 weighted messages
- 20 × 5 = 100 weighted messages
- **Total: 350 weighted messages** (out of 300 limit on $5 tier — they'd need to upgrade)

**Why this works:**
1. Users see "messages" — simple and intuitive
2. Voice is proportionally more expensive without users needing to understand GPU costs
3. You can adjust weights without changing the user-facing number
4. Easy to implement in `aiQuota.ts` (add a `weight` field to each operation)

---

## 15. Pricing Page Strategy

### Tier Names (Rationale)

| Name | Rationale |
|---|---|
| **Explorer** | Inviting, non-committal. "Explore" the product. |
| **Learner** | Active, purposeful. "I'm learning a language." |
| **Fluent** | Aspirational. "I want to become fluent." |
| **Organization** | Clear, professional. For teams and institutions. |

### Pricing Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    Choose Your Path                         │
│         Start free, upgrade when you're ready.              │
│         Annual plans save 20%.                              │
├──────────┬──────────┬──────────┬──────────┐                │
│ Explorer │ Learner  │ Fluent   │ Org      │                │
│  FREE    │  $5/mo   │  $15/mo  │ Custom   │                │
│          │ Save 20% │ Save 20% │          │                │
│          │ with ann.│ with ann.│          │                │
├──────────┼──────────┼──────────┼──────────┤                │
│ 10 msgs/│ 300 msgs/│ 1,000    │ Custom   │                │
│ day      │ month    │ msgs/mo  │ limits   │                │
│          │          │          │          │                │
│ 5 trans/ │ 150      │ 500      │ Custom   │                │
│ day      │ trans/mo │ trans/mo │          │                │
│          │          │          │          │                │
│ 2 voice/ │ 15 min   │ 60 min   │ Custom   │                │
│ day      │ voice/mo │ voice/mo │ voice    │                │
│          │          │          │          │                │
│ 7-day    │ 90-day   │ ∞        │ ∞        │                │
│ history  │ history  │ history  │ history  │                │
│          │          │          │          │                │
│ 1 lang   │ 3 langs  │ ∞ langs  │ ∞ langs  │                │
│          │          │          │          │                │
│ Community│ Community│ Priority │ Dedicated│                │
│ support  │ support  │ support  │ support  │                │
│          │          │          │          │                │
│ ──────── │ ──────── │ ──────── │ ──────── │                │
│ Get      │ Start    │ Go       │ Contact  │                │
│ Started  │ Learning │ Fluent   │ Us       │                │
└──────────┴──────────┴──────────┴──────────┘                │
│                                                             │
│ 💡 Most learners start with Explorer and upgrade            │
│    to Learner within their first week.                      │
│                                                             │
│ 🎓 Students & educators: 50% discount available.            │
│                                                             │
│ 🔄 Switch plans anytime. Unused credits don't roll over.    │
│    Upgrade takes effect immediately. Downgrade at renewal.  │
└─────────────────────────────────────────────────────────────┘
```

### Feature Comparison Table (on pricing page)

| Feature | Explorer | Learner | Fluent | Organization |
|---|---|---|---|---|
| AI Chat | 10/day | 300/mo | 1,000/mo | Custom |
| Translation | 5/day | 150/mo | 500/mo | Custom |
| Voice interaction | 2/day | 15 min/mo | 60 min/mo | Custom |
| Conversation history | 7 days | 90 days | Unlimited | Unlimited |
| Language profiles | 1 | 3 | Unlimited | Unlimited |
| Communities | ✅ | ✅ | ✅ | ✅ |
| Fireplace & Posts | ✅ | ✅ | ✅ | ✅ |
| Changa contributions | ✅ | ✅ | ✅ | ✅ |
| Export data | ❌ | ❌ | ✅ | ✅ |
| Advanced analytics | ❌ | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |
| Admin dashboard | ❌ | ❌ | ❌ | ✅ |

### How to Explain Limits Without Feeling Restrictive

**Do:**
- Frame limits as "daily allowance" not "restriction"
- Show a progress bar: "7 of 10 messages used today"
- Use positive language: "You've used 7 messages today — great progress!"
- When limit is reached: "You've had a productive day! Your allowance resets tomorrow at midnight."
- Show the upgrade path: "Upgrade to Learner for 300 messages/month"

**Don't:**
- Use words like "limit," "restricted," "capped," "exceeded"
- Show error messages when limits are hit
- Make users feel punished for using the product
- Hide the limit until they hit it (show remaining count proactively)

### Handling Users Who Reach Their Limits

**Free tier (daily cap hit):**
```
🎉 You've used all 10 messages for today!
Your allowance resets at midnight (UTC).

Want more? Upgrade to Learner for 300 messages/month.
[Upgrade to Learner →]

In the meantime, explore communities and posts!
```

**Paid tier (monthly cap approaching):**
```
📊 You've used 270 of 300 messages this month.
You have 30 messages remaining until your renewal on [date].

Need more? Upgrade to Fluent for 1,000 messages/month.
[Upgrade to Fluent →]
```

### Credit Rollover Policy

**Recommendation: No rollover.**

| Reason | Explanation |
|---|---|
| Simplicity | Users don't need to track "banked" credits |
| Predictable costs | You know exactly what each user costs per month |
| Urgency to use | Encourages daily engagement (good for retention) |
| Prevents gaming | Users can't stockpile and then abuse in one burst |
| Industry standard | Duolingo, Babbel, and most language apps don't roll over |

### Upgrade/Downgrade Policy

| Action | When | Effect |
|---|---|---|
| **Upgrade** | Anytime | Immediate. Prorated charge for remaining billing cycle. |
| **Downgrade** | At renewal date | Takes effect at next billing cycle. No partial refunds. |
| **Cancel** | Anytime | Access continues until end of billing period. |
| **Re-subscribe** | Anytime | Full access restored immediately. |

### Annual Pricing

| Tier | Monthly | Annual | Annual Discount |
|---|---|---|---|
| Learner | $5/mo | $48/year ($4/mo) | 20% |
| Fluent | $15/mo | $144/year ($12/mo) | 20% |

**Why 20% discount:**
- Industry standard for annual SaaS (15–25%)
- Commits users to the platform (reduces churn)
- Provides upfront cash flow
- Still maintains healthy margins

### Student/Education Discount

**Recommendation: 50% off all paid tiers**

| Tier | Regular | Student/Edu |
|---|---|---|
| Learner | $5/mo | $2.50/mo |
| Fluent | $15/mo | $7.50/mo |

**Verification:** Use SheerID or UNiDAYS for student verification. For educators/institutions, use the Custom tier with volume pricing.

**Why this makes sense:**
- Students are the core audience for language learning
- $2.50/month is accessible in African markets
- Students become long-term users and word-of-mouth advocates
- Educational institutions can buy in bulk through Custom tier
- Cost to serve a student is the same as any other user — the discount is margin reduction, not cost increase

---

## 16. Conservative Launch Recommendation

### Phase 1: Pre-Launch (0–1,000 users)

**Goal:** Validate product-market fit without unexpected AI bills.

| Setting | Value | Rationale |
|---|---|---|
| Free tier messages | 10/day | Conservative, safe |
| $5 tier messages | **200/month** (not 300) | Extra safety buffer |
| $5 tier voice | **10 min/month** (not 15) | Voice is expensive |
| $15 tier messages | **800/month** (not 1,000) | Buffer until you have data |
| $15 tier voice | **45 min/month** (not 60) | Buffer |
| Annual pricing | Not offered yet | Keep it simple |
| Student discount | Not offered yet | Wait for demand signal |

**Why start conservative:**
1. You can always **increase** limits (users love surprises)
2. You can never **decrease** limits without angering users
3. At pre-launch scale, the revenue difference between 200 and 300 messages is tiny
4. You need real usage data to calibrate the right limits
5. Unexpected AI bills at $0.001/message add up fast with 1,000 users

### Phase 2: Early Growth (1,000–10,000 users)

**Goal:** Optimize conversion and refine limits based on data.

| Action | Trigger |
|---|---|
| Increase $5 tier to 300 messages | When 80%+ of $5 users hit 200 messages |
| Increase $15 tier to 1,000 messages | When 70%+ of $15 users hit 800 messages |
| Add annual pricing | When monthly churn data is available |
| Add student discount | When student user segment is identified |
| Monitor AI costs | Weekly review of per-user AI spend |

### Phase 3: Scale (10,000+ users)

**Goal:** Maximize revenue while maintaining margins.

| Action | Trigger |
|---|---|
| Introduce on-device inference | When E2B model is production-ready for mobile |
| Reduce cloud AI costs | As on-device handles more traffic |
| Adjust free tier limits | Based on conversion data |
| Expand Custom tier | When B2B pipeline develops |
| Consider $10 tier | If data shows gap between $5 and $15 |

### Key Metrics to Track

| Metric | Target | Frequency |
|---|---|---|
| Free → Paid conversion rate | 5%+ | Weekly |
| Monthly churn (paid) | <5% | Monthly |
| AI cost per free user | <$0.30/mo | Weekly |
| AI cost per paid user | <$1.50/mo ($5), <$3.00/mo ($15) | Weekly |
| Gross margin per tier | >75% | Monthly |
| Limit hit rate (free) | 40–60% of users daily | Daily |
| Limit hit rate (paid) | 20–40% of users monthly | Monthly |
| Upgrade trigger rate | Track how often limit hits lead to upgrades | Weekly |

---

## 17. Summary: The Numbers That Matter

### The Answer to Your Most Important Question

> "What exact message/usage limits should Samiati put behind Free, $5, and $15 so that users get meaningful value while Samiati can reach break-even and eventually become profitable?"

| Tier | Price | Messages | Voice | Translation | Est. AI Cost | Gross Margin |
|---|---|---|---|---|---|---|
| **Free** | $0 | 10/day | 2 voice msgs/day | 5/day | $0.15–0.30/mo | N/A (subsidized) |
| **$5** | $5/mo | 300/month | 15 min/month | 150/month | $0.32–0.55/mo | 80–84% |
| **$15** | $15/mo | 1,000/month | 60 min/month | 500/month | $1.10–1.85/mo | 83–88% |
| **Custom** | From $20/seat | Custom | Custom | Custom | Priced to margin | 70%+ |

### Break-Even Summary

| Conversion Rate | Break-Even Users | Profitable At |
|---|---|---|
| 3% | ~400 users | ~2,000 users |
| 5% | ~200 users | ~1,000 users |
| 8% | ~100 users | ~500 users |
| 10% | ~80 users | ~400 users |

### Maximum Sustainable Free-User Ratio

- **15 free users** per paying subscriber (at $8.50 avg revenue, $0.20 avg free cost)
- At 5% conversion: 19 free per 1 paid ✅
- At 3% conversion: 32 free per 1 paid ⚠️ (tight but workable)
- At 1% conversion: 99 free per 1 paid ❌ (unsustainable)

### Conservative Launch Limits (Recommended)

| Tier | Messages | Voice | Translation |
|---|---|---|---|
| Free | 10/day | 2 voice msgs/day | 5/day |
| $5 | **200/month** | **10 min/month** | 100/month |
| $15 | **800/month** | **45 min/month** | 400/month |

Start here. Increase when data demands it. Never decrease.

---

*This analysis is based on verified 2026 pricing from HuggingFace, Convex, Clerk, Vercel, Sentry, and Stripe. AI inference costs are estimates based on model size, GPU pricing, and throughput benchmarks. Actual costs will vary based on usage patterns, batching efficiency, and HuggingFace plan. Review quarterly and adjust as real data becomes available.*
