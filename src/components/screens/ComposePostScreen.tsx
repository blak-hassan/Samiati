"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Screen, User } from '@/types';
import {
  X,
  Send,
  Globe,
  Lock,
  LockKeyholeOpen,
  AtSign,
  Image as ImageIcon,
  BarChart2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  Smile,
  FileVideo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  onPost: (content: string, image?: string, postData?: any) => void;
  user: User;
}

const ComposePostScreen: React.FC<Props> = ({ navigate, goBack, onPost, user }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [cw, setCw] = useState<string>('');
  const [showCw, setShowCw] = useState(false);
  const [visibility, setVisibility] = useState<'Public' | 'Unlisted' | 'Followers' | 'Direct'>('Public');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  // Poll State
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState('1 day');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstPollInputRef = useRef<HTMLInputElement>(null);

  // Focus first poll input when opened
  useEffect(() => {
    if (showPoll && firstPollInputRef.current) {
      firstPollInputRef.current.focus();
    }
  }, [showPoll]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = () => {
    if (!text.trim() && !image && !showPoll) return;

    // Structure post data
    const postData: any = {
      visibility,
      cw: showCw && cw.trim() ? cw : undefined,
    };

    if (showPoll) {
      const validOptions = pollOptions.filter(o => o.trim().length > 0);
      if (validOptions.length >= 2) {
        postData.poll = {
          options: validOptions.map((label, idx) => ({
            id: `opt-${idx}`,
            label,
            votes: 0
          })),
          totalVotes: 0,
          endsAt: pollDuration,
          userVotedOptionId: null
        };
      }
    }

    // Pass structured data. Content is just text, CW is separate.
    onPost(text, image || undefined, postData);
    goBack();
  };

  const handlePollOptionChange = (index: number, value: string) => {
    if (value.length > 25) return; // Character limit for UI cleanliness
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'Public': return <Globe className="w-4 h-4" />;
      case 'Unlisted': return <LockKeyholeOpen className="w-4 h-4" />;
      case 'Followers': return <Lock className="w-4 h-4" />;
      case 'Direct': return <AtSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-30">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="text-muted-foreground hover:text-foreground font-bold"
        >
          Cancel
        </Button>
        <Button
          onClick={handlePublish}
          disabled={(!text.trim() && !image && !showPoll) || (showPoll && pollOptions.filter(o => o.trim()).length < 2)}
          className="rounded-full gap-2 font-black text-xs uppercase tracking-widest px-6 h-9"
        >
          <Send className="w-3.5 h-3.5" />
          Publish
        </Button>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="flex gap-4">
          <Avatar className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border">
            <AvatarImage src={user.avatar} className="object-cover" />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col gap-4">
            {showCw && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-1.5 ml-1">
                  <AlertCircle className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Content Warning</span>
                </div>
                <Input
                  type="text"
                  value={cw}
                  onChange={(e) => setCw(e.target.value)}
                  placeholder="What's this about? (e.g. Spoilers, Politics)"
                  className="w-full bg-muted/30 border-primary/20 rounded-xl h-10 text-sm focus-visible:ring-primary/20"
                  autoFocus
                />
              </div>
            )}

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Habari gani? What's the news?"
              className="w-full bg-transparent text-xl border-none p-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 resize-none min-h-[160px] leading-relaxed font-medium"
              autoFocus={!showCw}
            />

            {image && (
              <div className="relative mt-2 rounded-2xl overflow-hidden group w-fit border border-border shadow-xl">
                <img src={image} alt="Preview" className="max-w-full h-auto max-h-80 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" />
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => setImage(null)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-90 backdrop-blur-md shadow-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {showPoll && (
              <Card className="bg-muted/30 p-4 rounded-2xl border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-black uppercase tracking-[0.15em] text-foreground/80">Active Poll</h4>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowPoll(false)} className="h-8 w-8 rounded-full text-muted-foreground">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="flex-1 relative">
                        <Input
                          ref={idx === 0 ? firstPollInputRef : null}
                          value={opt}
                          onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                          placeholder={`Choice ${idx + 1}...`}
                          className="h-10 bg-background border-border/50 rounded-xl pr-10 text-sm focus-visible:ring-primary/20"
                        />
                        {opt.length > 20 && (
                          <span className="absolute right-3 top-3 text-[10px] text-muted-foreground font-mono font-bold">{25 - opt.length}</span>
                        )}
                      </div>
                      {pollOptions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePollOption(idx)}
                          className="text-muted-foreground hover:text-destructive h-10 w-10 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <Button
                      variant="outline"
                      onClick={addPollOption}
                      className="w-full h-10 rounded-xl gap-2 font-bold text-xs border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add another choice
                    </Button>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em]">Expiration</span>
                  <select
                    value={pollDuration}
                    onChange={(e) => setPollDuration(e.target.value)}
                    className="bg-muted/50 text-[11px] font-bold text-foreground px-3 py-1.5 rounded-lg outline-none cursor-pointer border border-border/50 hover:border-primary/30 transition-all uppercase tracking-wider"
                  >
                    <option value="5 minutes">5 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="1 day">1 day (Default)</option>
                    <option value="3 days">3 days</option>
                    <option value="7 days">7 days</option>
                  </select>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Toolbar */}
      <div className="px-4 py-3 border-t border-border bg-background pb-safe sticky bottom-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full text-muted-foreground hover:text-primary h-10 w-10"
              title="Add Image"
              disabled={showPoll}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCw(!showCw)}
              className={cn(
                "rounded-full font-black text-[11px] uppercase tracking-widest px-3 h-8 gap-1.5 transition-all",
                showCw ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-primary"
              )}
              title="Content Warning"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              CW
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPoll(!showPoll)}
              className={cn(
                "rounded-full h-10 w-10 transition-all",
                showPoll ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
              )}
              title="Poll"
              disabled={!!image}
            >
              <BarChart2 className="w-5 h-5" />
            </Button>

            <Popover open={showVisibilityMenu} onOpenChange={setShowVisibilityMenu}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary"
                  title="Privacy"
                >
                  {getVisibilityIcon()}
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-[180px] p-1.5 rounded-2xl shadow-2xl border-border bg-background">
                {(['Public', 'Unlisted', 'Followers', 'Direct'] as const).map(opt => (
                  <Button
                    key={opt}
                    variant="ghost"
                    onClick={() => { setVisibility(opt); setShowVisibilityMenu(false); }}
                    className={cn(
                      "w-full justify-start gap-3 h-10 px-3 rounded-xl text-[13px] font-bold transition-all",
                      visibility === opt ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted"
                    )}
                  >
                    <div className={cn("w-4 h-4", visibility === opt ? "text-primary" : "text-muted-foreground")}>
                      {opt === 'Public' ? <Globe className="w-4 h-4" /> :
                        opt === 'Unlisted' ? <LockKeyholeOpen className="w-4 h-4" /> :
                          opt === 'Followers' ? <Lock className="w-4 h-4" /> :
                            <AtSign className="w-4 h-4" />}
                    </div>
                    {opt}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "text-[10px] font-black font-mono tracking-tighter w-8 text-right",
              text.length > 480 ? "text-destructive scale-110" : "text-muted-foreground/40"
            )}>
              {500 - text.length}
            </div>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-full">
              <Smile className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposePostScreen;

