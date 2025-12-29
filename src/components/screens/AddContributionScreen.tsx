"use client";
import React, { useState } from 'react';
import { Screen, ContributionItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  onSave?: (item: ContributionItem) => void;
}

const AddContributionScreen: React.FC<Props> = ({ navigate, goBack, onSave }) => {
  const [selectedType, setSelectedType] = useState('Proverb');
  const [input1, setInput1] = useState(''); // Local Language / Source
  const [input2, setInput2] = useState(''); // Translation / Target
  const [context, setContext] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const isTranslationMode = selectedType === 'Translate Paragraphs';

  const getInputConfig = () => {
    if (isTranslationMode) {
      return {
        label1: "English Text (Source)",
        placeholder1: "Enter the English paragraph you want to translate...",
        defaultText1: "The village elder sat beneath the ancient baobab tree, gathering the children for an evening story.",
        label2: "Local Language Translation (Target)",
        placeholder2: "Write the translation in your local language...",
        desc: "Translate paragraphs from English to local language to improve the LLM."
      };
    }
    return {
      label1: "Local Language",
      placeholder1: "e.g., SÉ› woteetee o-pÉ”nkÉ” a, na É”yÉ› mmerÉ›w.",
      defaultText1: selectedType === 'Proverb' && !input1 ? "SÉ› woteetee o-pÉ”nkÉ” a, na É”yÉ› mmerÉ›w." : "",
      label2: "English Translation",
      placeholder2: "e.g., If you train a horse well, it becomes gentle.",
      defaultText2: selectedType === 'Proverb' && !input2 ? "If you train a horse well, it becomes gentle." : "",
      desc: ""
    };
  };

  const config = getInputConfig();

  // Initialize defaults if empty and specific type selected (for demo UX)
  React.useEffect(() => {
    if (selectedType === 'Proverb' && !input1) setInput1("SÉ› woteetee o-pÉ”nkÉ” a, na É”yÉ› mmerÉ›w.");
    if (selectedType === 'Proverb' && !input2) setInput2("If you train a horse well, it becomes gentle.");
    if (isTranslationMode && !input1) setInput1(config.defaultText1 || "");
  }, [selectedType, isTranslationMode]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    if (onSave) {
      const newItem: ContributionItem = {
        id: Date.now().toString(),
        type: selectedType,
        title: input1 || (selectedType === 'Proverb' ? "SÉ› woteetee o-pÉ”nkÉ” a, na É”yÉ› mmerÉ›w." : "New Changa"),
        subtitle: `${selectedType} â€¢ Submitted on ${new Date().toLocaleDateString()}`,
        status: 'Under Review',
        statusColor: 'text-warning',
        dotColor: 'bg-warning',
        icon: selectedType === 'Story' ? 'menu_book' : selectedType === 'Word' ? 'translate' : 'format_quote',
        likes: 0,
        dislikes: 0,
        commentsCount: 0,
        userVote: null,
        comments: [],
        showComments: false,
        tags: selectedTags
      };
      onSave(newItem);
    }
    navigate(Screen.CONTRIBUTIONS);
  };

  return (
    <div className="flex flex-col h-full bg-background transition-colors duration-300">
      <header className="flex items-center p-4 bg-background/95 backdrop-blur-md z-30 border-b border-border sticky top-0 transition-colors shrink-0">
        <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold pr-2 tracking-tight">Add Changa</h1>
        <Button variant="ghost" size="icon" className="text-primary rounded-full">
          <span className="material-symbols-outlined text-xl">check_circle</span>
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center gap-1.5 -mt-2">
          <span className="material-symbols-outlined text-sm text-muted-foreground/30">history</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Draft saved automatically</p>
        </div>

        {/* Goal */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">Your Changa Goal</h2>
          </div>
          <Card className="bg-muted/30 border-primary/10 p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Weekly Mastery Badge</span>
                <p className="text-xl font-black tracking-tight text-foreground">7 <span className="text-muted-foreground text-sm font-bold">/ 10 items</span></p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black h-6">+3 to GOAL</Badge>
            </div>
            <Progress value={70} className="h-2.5 bg-background border border-border" />
          </Card>
        </section>

        {/* Type Selection */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-lg">menu_book</span>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">Contribution Type</h2>
          </div>
          <Tabs defaultValue={selectedType} className="w-full" onValueChange={setSelectedType}>
            <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1.5 rounded-2xl border border-border/50">
              {['Word', 'Story', 'Proverb', 'Song', 'Phrases', 'Translate'].map(type => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="flex-1 min-w-[30%] h-10 rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all"
                >
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          {isTranslationMode && (
            <Card className="bg-primary/5 border-primary/20 p-4 flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
              </div>
              <div className="space-y-1">
                <p className="font-black text-xs uppercase tracking-widest text-foreground">Improve AI Precision</p>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">{config.desc}</p>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{config.label1}</Label>
            <Textarea
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
              className="min-h-[140px] bg-muted/20 border-border/50 rounded-2xl p-5 text-base font-medium focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 resize-none transition-all"
              placeholder={config.placeholder1}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{config.label2}</Label>
            <Textarea
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
              className="min-h-[140px] bg-muted/20 border-border/50 rounded-2xl p-5 text-base font-medium focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 resize-none transition-all"
              placeholder={config.placeholder2}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Context / Usage Notes <span className="opacity-40 font-bold lowercase tracking-normal">(optional)</span></Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[100px] bg-muted/20 border-border/50 rounded-2xl p-5 text-sm font-medium focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 resize-none transition-all"
              placeholder="e.g., 'Used when greeting an elder' or specific dialect information"
            />
          </div>
        </section>

        {/* Attachments */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-lg">add</span>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">Supportive Media</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="flex flex-col h-32 rounded-2xl border-dashed border-2 bg-muted/10 gap-2 group hover:bg-primary/5 hover:border-primary/50 transition-all">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">mic</span>
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest text-foreground">Attach Audio</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-32 rounded-2xl border-dashed border-2 bg-muted/10 gap-2 group hover:bg-primary/5 hover:border-primary/50 transition-all">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">image</span>
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest text-foreground">Attach Image</span>
            </Button>
          </div>
        </section>

        {/* Tags */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-lg">add</span>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">Classification Tags</h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {['Traditional', 'Modern', 'Formal', 'Informal', 'Dialect', 'Urban'].map(tag => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full h-9 px-4 text-xs font-bold uppercase tracking-wider transition-all",
                  selectedTags.includes(tag) ? "shadow-lg shadow-primary/20" : "bg-background border-border"
                )}
              >
                {tag}
              </Button>
            ))}
          </div>
        </section>

        {/* Reward */}
        <section>
          <Card className="bg-primary/10 border-primary/20 p-5 flex gap-4 items-center shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[80px] -mr-4 -mt-4 rotate-12">emoji_events</span>
            </div>
            <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-primary text-2xl">emoji_events</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Potential Rewards</p>
              <p className="text-sm font-bold text-foreground">
                Earn <span className="text-primary">+50 XP</span> & the <span className="text-primary italic">Storyteller</span> Badge!
              </p>
            </div>
          </Card>
        </section>

        {/* Preview */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-lg">visibility</span>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">Submission Preview</h2>
          </div>
          <Card className="bg-muted/30 border-border p-6 space-y-6 shadow-none">
            <div className="space-y-4">
              <div className="bg-background/80 backdrop-blur-sm p-5 rounded-2xl border border-border/50 transition-all">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">{config.label1}</h3>
                <p className="text-base font-semibold text-foreground tracking-tight leading-relaxed italic">
                  {input1 || config.defaultText1 || "No content provided"}
                </p>
              </div>
              <div className="bg-background/80 backdrop-blur-sm p-5 rounded-2xl border border-border/50 transition-all">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">{config.label2}</h3>
                <p className="text-base font-semibold text-foreground tracking-tight leading-relaxed italic">
                  {input2 || config.defaultText2 || "No translation provided"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {selectedTags.length > 0 ? (
                selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-muted border-border">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">No tags selected</span>
              )}
            </div>

            <Separator className="bg-border/50" />

            <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
              <span className="material-symbols-outlined text-primary text-base mt-0.5">groups</span>
              <div className="space-y-1">
                <p className="font-black text-[10px] uppercase tracking-widest text-foreground">Community Verification</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">After you submit, the community will review and vote on this Changa for final approval.</p>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="z-30 bg-background/95 backdrop-blur-md p-6 border-t border-border transition-colors shrink-0">
        <div className="flex gap-4 max-w-2xl mx-auto">
          <Button variant="outline" className="flex-1 h-14 rounded-2xl gap-3 font-black text-xs uppercase tracking-[0.2em] shadow-sm transform active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">visibility</span>
            Preview
          </Button>
          <Button onClick={handleSubmit} className="flex-1 h-14 rounded-2xl gap-3 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transform active:scale-95 transition-all">
            Submit Changa
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
          <span className="material-symbols-outlined text-sm opacity-50">schedule</span>
          <p className="text-[10px] font-black uppercase tracking-widest">Est. Reward: <span className="text-primary">+15 XP</span></p>
        </div>
      </footer>
    </div>
  );
};

export default AddContributionScreen;

