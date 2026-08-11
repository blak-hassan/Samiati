"use client";
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen, ContributionItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { MediaSelector } from '@/components/media/MediaSelector';
import { AudioRecorder } from '@/components/media/AudioRecorder';
import { MediaPreview } from '@/components/media/MediaPreview';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CONTRIBUTION_TYPES } from '@/lib/constants';
import { calculateXP } from '@/services/xpService';
import { contributionSchema, ContributionFormData } from '@/lib/schemas';

interface Attachment {
  id: string;
  file: File;
  previewUrl: string;
  type: 'audio' | 'image' | 'video';
}

interface Props {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  onSave?: (item: ContributionItem) => Promise<void>;
  initialData?: ContributionItem;
  availableTasks?: ContributionItem[];
}

const AddContributionScreen: React.FC<Props> = ({
  navigate,
  goBack,
  onSave,
  initialData,
  availableTasks,
}) => {
  const [selectedType, setSelectedType] = useState(initialData?.type || 'Proverb');
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTypeExpanded, setIsTypeExpanded] = useState(false);

  const [selectorType, setSelectorType] = useState<'audio' | 'image' | 'video' | null>(null);
  const pendingTypeRef = useRef<'audio' | 'image' | 'video' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialData?.attachments?.map((a) => ({
      id: a.id,
      file: new File([], a.name, { type: a.type }),
      previewUrl: a.url,
      type: a.type as Attachment['type'],
    })) || []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isTranslationMode = selectedType === 'Translate Paragraphs';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      type: selectedType,
      input1: initialData?.content || '',
      input2: initialData?.translation || '',
      context: initialData?.context || '',
      tags: initialData?.tags || [],
    },
  });

  const input1 = watch('input1');
  const input2 = watch('input2');
  const context = watch('context');
  const selectedTags = watch('tags');

  const getInputConfig = () => {
    if (isTranslationMode) {
      return {
        label1: 'English Text (Source)',
        placeholder1: 'Enter the English paragraph you want to translate...',
        defaultText1:
          'The village elder sat beneath the ancient baobab tree, gathering the children for an evening story.',
        label2: 'Local Language Translation (Target)',
        placeholder2: 'Write the translation in your local language...',
        desc: 'Translate paragraphs from English to local language to improve the LLM.',
      };
    }
    return {
      label1: 'Local Language',
      placeholder1: 'e.g., Sè woteetee o-pönkö a, na öyè mmerèw.',
      defaultText1:
        selectedType === 'Proverb' && !input1
          ? 'Sè woteetee o-pönkö a, na öyè mmerèw.'
          : '',
      label2: 'English Translation',
      placeholder2: 'e.g., If you train a horse well, it becomes gentle.',
      defaultText2:
        selectedType === 'Proverb' && !input2
          ? 'If you train a horse well, it becomes gentle.'
          : '',
      desc: '',
    };
  };

  const config = getInputConfig();

  React.useEffect(() => {
    if (initialData) return;
    if (selectedType === 'Proverb' && !input1) {
      setValue('input1', 'Sè woteetee o-pönkö a, na öyè mmerèw.');
    }
    if (selectedType === 'Proverb' && !input2) {
      setValue('input2', 'If you train a horse well, it becomes gentle.');
    }
    if (isTranslationMode && !input1) {
      setValue('input1', config.defaultText1 || '');
    }
  }, [selectedType, isTranslationMode, config.defaultText1, input1, input2, initialData, setValue]);

  const toggleTag = (tag: string) => {
    const current = selectedTags;
    if (current.includes(tag)) {
      setValue(
        'tags',
        current.filter((t) => t !== tag),
        { shouldValidate: true }
      );
    } else {
      setValue('tags', [...current, tag], { shouldValidate: true });
    }
  };

  const handleAddCustomType = () => {
    if (newTypeName.trim()) {
      const type = newTypeName.trim();
      if (![...CONTRIBUTION_TYPES.map((t) => t.id), ...customTypes].includes(type)) {
        setCustomTypes((prev) => [...prev, type]);
      }
      setSelectedType(type);
      setValue('type', type);
      setNewTypeName('');
      setIsAddingCustomType(false);
    }
  };

  const addAttachment = (file: File, type: 'audio' | 'image' | 'video') => {
    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      type,
    };
    setAttachments((prev) => [...prev, newAttachment]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      const removed = prev.find((a) => a.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const type = pendingTypeRef.current;
    if (files && files.length > 0 && type) {
      Array.from(files).forEach((file) => addAttachment(file, type));
      e.target.value = '';
      pendingTypeRef.current = null;
    }
  };

  const handleSelectSource = (source: 'upload' | 'capture') => {
    if (!selectorType) return;
    pendingTypeRef.current = selectorType;
    if (source === 'upload') {
      fileInputRef.current?.removeAttribute('capture');
      fileInputRef.current?.click();
    } else {
      if (selectorType === 'audio') {
        setIsRecording(true);
      } else if (selectorType === 'image') {
        fileInputRef.current?.setAttribute('capture', 'environment');
        fileInputRef.current?.click();
      }
    }
  };

  const onSubmit = async (data: ContributionFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (onSave) {
      const typeConfig = CONTRIBUTION_TYPES.find((t) => t.id === selectedType);
      const icon = typeConfig?.icon || 'history_edu';

      const newItem: ContributionItem = {
        id: initialData?.id || Date.now().toString(),
        type: selectedType,
        title: data.input1 || (selectedType === 'Proverb' ? 'Sè woteetee o-pönkö a, na öyè mmerèw.' : 'New Changa'),
        subtitle:
          initialData?.subtitle || `${selectedType} • Submitted on ${new Date().toLocaleDateString()}`,
        status: initialData?.status || 'Under Review',
        statusColor: initialData?.statusColor || 'text-warning',
        dotColor: initialData?.dotColor || 'bg-warning',
        icon,
        likes: initialData?.likes || 0,
        dislikes: initialData?.dislikes || 0,
        commentsCount: initialData?.commentsCount || 0,
        userVote: initialData?.userVote || null,
        comments: initialData?.comments || [],
        showComments: false,
        tags: data.tags,
        content: data.input1,
        translation: data.input2,
        context: data.context,
        attachments: attachments.map((a) => ({
          id: a.id,
          type: a.type,
          url: a.previewUrl,
          name: a.file.name,
        })),
      };
      onSave(newItem);
    }

    setIsSubmitting(false);
    navigate(Screen.CONTRIBUTIONS, { initialTab: 'My Changa', statusFilter: 'Under Review' });
  };

  return (
    <div className="flex flex-col h-full bg-background transition-colors duration-300">
      <header className="flex items-center p-4 bg-background/95 backdrop-blur-md z-30 border-b border-border sticky top-0 transition-colors shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="-ml-2 rounded-full"
          disabled={isSubmitting}
        >
          <IconRenderer name="arrow_back" size={24} />
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold pr-2 tracking-tight">
          {initialData ? 'Refine Changa' : 'Add Changa'}
        </h1>
        <div
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-full transition-all duration-300",
            isSubmitting && "bg-primary/10"
          )}
        >
          <IconRenderer
            name={isSubmitting ? 'progress_activity' : 'check_circle'}
            size={20}
            className={cn(
              "transition-all duration-500",
              isSubmitting ? 'text-rasta-gold' : 'text-primary'
            )}
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar max-w-2xl mx-auto w-full">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <IconRenderer name="auto_awesome" className="text-primary" size={18} />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
              Your Changa Goal
            </h2>
          </div>
          <Card className="bg-muted/30 border-primary/10 p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Weekly Mastery Badge
                </span>
                <p className="text-xl font-black tracking-tight text-foreground">
                  7 <span className="text-muted-foreground text-sm font-bold">/ 10 items</span>
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-none text-[10px] font-black h-6"
              >
                +3 to GOAL
              </Badge>
            </div>
            <Progress value={70} className="h-2.5 bg-background border border-border" />
          </Card>
        </section>

        {availableTasks && availableTasks.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <IconRenderer name="assignment" className="text-primary" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
                Available Tasks
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border whitespace-nowrap bg-muted/30 text-muted-foreground border-border/50"
                >
                  {task.title}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div
            className="flex items-center justify-between cursor-pointer group select-none"
            onClick={() => setIsTypeExpanded(!isTypeExpanded)}
          >
            <div className="flex items-center gap-2">
              <IconRenderer name="menu_book" className="text-primary" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
                Contribution Type
                {!isTypeExpanded && (
                  <span className="ml-2 text-primary font-bold transition-all animate-in fade-in slide-in-from-left-2">
                    — {selectedType}
                  </span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors border-none"
              >
                {isTypeExpanded ? 'Hide' : 'Expand'}
              </Badge>
              <IconRenderer
                name="expand_more"
                className={cn(
                  "transition-transform duration-500 text-muted-foreground group-hover:text-primary",
                  isTypeExpanded ? 'rotate-180' : ''
                )}
              />
            </div>
          </div>

          {isTypeExpanded && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-3 pb-4 -mx-6 px-6 snap-x snap-mandatory scroll-smooth" ref={scrollContainerRef}>
                  {[...CONTRIBUTION_TYPES.map((t) => t.id), ...customTypes].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        setValue('type', type);
                      }}
                      className={cn(
                        "snap-center shrink-0 h-11 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border whitespace-nowrap",
                        selectedType === type
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105 z-10"
                          : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsAddingCustomType(true)}
                    className="snap-center shrink-0 h-11 w-11 flex items-center justify-center rounded-2xl font-black text-xl bg-primary/5 text-primary border border-dashed border-primary/30 hover:bg-primary/10 transition-all"
                    title="Add Custom Type"
                  >
                    +
                  </button>
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between -mx-2 pointer-events-none z-20">
                  <button
                    onClick={() =>
                      scrollContainerRef.current?.scrollBy({ left: -150, behavior: 'smooth' })
                    }
                    className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-md flex items-center justify-center hover:bg-primary hover:text-white transition-all pointer-events-auto"
                    title="Previous Type"
                  >
                    <IconRenderer name="chevron_left" size={14} className="font-black" />
                  </button>
                  <button
                    onClick={() =>
                      scrollContainerRef.current?.scrollBy({ left: 150, behavior: 'smooth' })
                    }
                    className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-md flex items-center justify-center hover:bg-primary hover:text-white transition-all pointer-events-auto"
                    title="Next Type"
                  >
                    <IconRenderer name="chevron_right" size={14} className="font-black" />
                  </button>
                </div>
              </div>

              {isAddingCustomType && (
                <div className="flex gap-2 animate-in zoom-in-95 duration-200">
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="E.g., Riddle, Recipe, Chant..."
                    className="h-10 rounded-xl text-xs font-bold uppercase tracking-widest bg-muted/20 border-primary/20"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomType()}
                  />
                  <Button
                    onClick={handleAddCustomType}
                    className="h-10 rounded-xl px-4 font-black text-[10px] uppercase tracking-widest"
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsAddingCustomType(false)}
                    className="h-10 rounded-xl px-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-6">
          {isTranslationMode && (
            <Card className="bg-primary/5 border-primary/20 p-4 flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <IconRenderer name="auto_awesome" className="text-primary" size={20} />
              </div>
              <div className="space-y-1">
                <p className="font-black text-xs uppercase tracking-widest text-foreground">
                  Improve AI Precision
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {config.desc}
                </p>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              {config.label1}
            </Label>
            <Textarea
              {...register('input1')}
              className="min-h-[140px] bg-muted/20 border-border/50 rounded-2xl p-5 text-base font-medium focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 resize-none transition-all"
              placeholder={config.placeholder1}
            />
            {errors.input1 && (
              <p className="text-destructive text-xs font-medium">{errors.input1.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              {config.label2}
            </Label>
            <Textarea
              {...register('input2')}
              className="min-h-[140px] bg-muted/20 border-border/50 rounded-2xl p-5 text-base font-medium focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 resize-none transition-all"
              placeholder={config.placeholder2}
            />
            {errors.input2 && (
              <p className="text-destructive text-xs font-medium">{errors.input2.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Context / Usage Notes{' '}
              <span className="opacity-40 font-bold lowercase tracking-normal">(optional)</span>
            </Label>
            <Textarea
              {...register('context')}
              className="min-h-[100px] bg-muted/20 border-border/50 rounded-2xl p-5 text-sm font-medium focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 resize-none transition-all"
              placeholder="e.g., 'Used when greeting an elder' or specific dialect information"
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <IconRenderer name="add" className="text-primary" size={18} />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
              Supportive Media
            </h2>
          </div>

          <MediaPreview attachments={attachments} onRemove={removeAttachment} />

          {isRecording ? (
            <AudioRecorder
              onRecorded={(blob) => {
                const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
                addAttachment(file, 'audio');
                setIsRecording(false);
              }}
              onCancel={() => setIsRecording(false)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectorType('audio')}
                className="flex flex-col h-32 rounded-2xl border-dashed border-2 bg-muted/10 gap-2 group hover:bg-primary/5 hover:border-primary/50 transition-all"
              >
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <IconRenderer name="mic" className="text-primary" size={20} />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest text-foreground">
                  Attach Audio
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectorType('image')}
                className="flex flex-col h-32 rounded-2xl border-dashed border-2 bg-muted/10 gap-2 group hover:bg-primary/5 hover:border-primary/50 transition-all"
              >
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <IconRenderer name="image" className="text-primary" size={20} />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest text-foreground">
                  Attach Image
                </span>
              </Button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept={selectorType === 'audio' ? 'audio/*' : selectorType === 'image' ? 'image/*' : '*'}
            onChange={handleFileSelect}
          />

          <MediaSelector
            isOpen={!!selectorType}
            onClose={() => setSelectorType(null)}
            type={selectorType}
            onSelectSource={handleSelectSource}
          />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <IconRenderer name="add" className="text-primary" size={18} />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
              Classification Tags
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {['Traditional', 'Modern', 'Formal', 'Informal', 'Dialect', 'Urban'].map((tag) => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full h-9 px-4 text-xs font-bold uppercase tracking-wider transition-all",
                  selectedTags.includes(tag)
                    ? "shadow-lg shadow-primary/20"
                    : "bg-background border-border"
                )}
              >
                {tag}
              </Button>
            ))}
          </div>
        </section>

        <section>
          <div className="relative overflow-hidden rounded-2xl bg-[#3C2A21] p-6 shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy size={120} className="text-[#FFD700] -mr-8 -mt-8 rotate-12" />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
              <div className="h-14 w-14 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center shadow-inner border border-[#FFD700]/20 mb-1">
                <Trophy className="text-[#FFD700] drop-shadow-md" size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD700]/80">
                  Potential Rewards
                </p>
                <p className="text-lg font-bold text-[#F5F5DC]">
                  Earn{' '}
                  <span className="text-[#FFD700] text-xl">
                    + {calculateXP(selectedType, attachments.some((a) => a.type === 'audio'))} XP
                  </span>{' '}
                  & the{' '}
                  <span className="text-[#DAA520] italic font-black">
                    {selectedType === 'Story'
                      ? 'Storyteller'
                      : selectedType === 'Song'
                        ? 'Musician'
                        : selectedType === 'Word'
                          ? 'Linguist'
                          : 'Scholar'}
                  </span>{' '}
                  Badge!
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
            <IconRenderer name="groups" size={16} className="text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-[10px] uppercase tracking-widest text-foreground">
                Community Verification
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                After you submit, moderators review the changa before it moves to live, needs revision,
                or declined.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="z-30 bg-background/95 backdrop-blur-md p-6 border-t border-border transition-colors shrink-0">
        <div className="flex gap-4 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            className="flex-1 h-14 rounded-2xl gap-3 font-black text-xs uppercase tracking-[0.2em] shadow-sm transform active:scale-95 transition-all"
          >
            <IconRenderer name="visibility" size={18} />
            Preview
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 h-14 rounded-2xl gap-3 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transform active:scale-95 transition-all"
          >
            {isSubmitting ? 'Changa...' : 'Changa'}
            <IconRenderer
              name={isSubmitting ? 'publish' : 'arrow_forward'}
              size={18}
              className={cn(isSubmitting && 'animate-pulse')}
            />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
          <IconRenderer name="schedule" size={14} className="opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-widest">
            Est. Reward:{' '}
            <span className="text-primary">
              +{calculateXP(selectedType, attachments.some((a) => a.type === 'audio'))} XP
            </span>
          </p>
        </div>
      </footer>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
          <div className="h-[80vh] flex flex-col bg-background">
            <DialogHeader className="p-6 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-10">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <IconRenderer name="visibility" className="text-primary" />
                Changa Preview
              </DialogTitle>
              <DialogDescription className="font-medium">
                This is how your contribution will appear to the community.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                      {config.label1}
                    </h3>
                    <p className="text-base font-semibold text-foreground tracking-tight leading-relaxed italic">
                      {input1 || config.defaultText1 || 'No content provided'}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                      {config.label2}
                    </h3>
                    <p className="text-base font-semibold text-foreground tracking-tight leading-relaxed italic">
                      {input2 || config.defaultText2 || 'No translation provided'}
                    </p>
                  </div>
                  {context && (
                    <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                        Context
                      </h3>
                      <p className="text-sm font-medium text-foreground/80 leading-relaxed">{context}</p>
                    </div>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                      Attachments
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-3 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-4"
                        >
                          <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/50">
                            {att.type === 'image' ? (
                              <img
                                src={att.previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <IconRenderer
                                name={att.type === 'audio' ? 'music_note' : 'videocam'}
                                className="text-primary"
                                size={20}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{att.file.name}</p>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                              {(att.file.size / 1024).toFixed(1)} KB • {att.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap pb-6">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-muted border-border"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">
                      No tags selected
                    </span>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-border bg-background">
              <Button
                onClick={() => setIsPreviewOpen(false)}
                className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
              >
                Continue Editing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddContributionScreen;
