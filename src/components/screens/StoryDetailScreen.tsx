"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Screen, User } from '@/types';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Sparkles,
  Quote,
  Hand,
  BookOpen,
  Headphones,
  Pause,
  X,
  Link2,
  CheckCircle2,
  MessageCircle,
  Twitter,
  Facebook,
  Mail,
  Clock,
  Calendar,
  Play,
  Volume2,
  Trophy,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface StoryParam {
  title: string;
  author: string;
  img: string;
  type: string;
  avatar?: string;
  date?: string;
  readTime?: string;
}

interface Props {
  navigate: (screen: Screen, params?: any) => void;
  goBack: () => void;
  story?: StoryParam;
  onViewProfile: (user: User) => void;
}

const DEFAULT_STORY: StoryParam = {
  title: "The Spider's Web",
  author: "Amina Diallo",
  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTCkmqfVuPlLQ4IRyL2yV9d82xXGhUn6PZJQuyR-wOR0cvIaU2RmXVEYxrDKRF8LwvPO8ui_vLey4StEqf8CTMHBir5NqJ8BI6X6gXKzW2e5jtCmaOROPdLEoAJCmmFm51ht9zq7QwPnSBQC8TAqlJfRa5M4kLarJ9LqR6i2YIFBkKl3YmSCiPo77SFPw336bJQN6weNdBrPdUlu-Ta6wtwbzNsRkfyTwRr05-OJF-2JEsH1EwbuwH-dLxzpESsJxfK0fBRGIneoQ',
  type: "Folklore • Akan Tradition",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8",
  date: "Dec 15, 2023",
  readTime: "5 min read"
};

const RELATED_STORIES: StoryParam[] = [
  { title: "Why the Tortoise has a cracked shell", author: "Chike Okoro", type: 'Story', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c' },
  { title: "The Moon and the Sun", author: "Fatou Sow", type: 'Story', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgGK4HiP_WY3pOD4a5vjGWGtQqUUhOEyj94mc4Il4W9cK7uPISoDqA2_rAz6yx1hMgSr8B5pR8Q6cUCf4E81l5Yo--0f2oCHKyYXaSMxJOQKq6tn9MI-Cjx-_4Er3rmI0A8aTcqHLHpt7l2rEFyWita0CSiwer0MhunOiGwr3xKNC0bD-0tv8nalLieXnnzrSwIA5w9S3Fmuvy2UtBjpw7MdkR-USmYOn1ZIjsdIHGV9bFOVr97G958mCv7m40Q8Pa3Wq6A3Td9dk' },
  { title: "Anansi goes fishing", author: "Kwame", type: 'Story', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOIwrsG4DdrbXTAYf-WXRBaHgcqmT14MY_lmYvUkyZtg0RT_-_dHr_napeF6KMniL8zX6d4_A3RDIuiWm9yAZgdZNsgMfxya3pNJsh4WtKmq86hGYPf6PsZ1APxyHvNxwo803VmKszYhTsb0nAz5-Pxy_PLCdxtBBnmNAa-aAkGgOXRGmz1mu-iKxyz51wJ0BR7y9Nre3kHGXsNisV4cm71L-A43Q2DUXEuzYtM8CFrV2G7RI6c3hfmOgx8Mv-pQQhgBITOcU8TIE' },
  { title: "The Lion's Whiskers", author: "Abebe Bikila", type: 'Story', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc' },
  { title: "Thunder and Lightning", author: "Ngozi", type: 'Myth', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4lz2n92fP-3f8sFkeqH_L_kJ7Q2AZ-rKVTVq2mHkBM03IcR48LuFc52l2n01S6qFNeWfcKfWiRGfDWXx7jltQFbz09EH7Jmydr-dedWx_HiMM9BpKt4Q-KGq3CwTb0q_yQEwiNpQK3YPa8Jc0yYElrtn0iiMkXVI_6ThJOtnJOGkzZ5LVghgn3cawRvuHQuHSu6qXCXFuc78ULoKqjHj55wHc9kHkNIrpnsanbDaYLZo0KNkg3XyohzwahpixxUaa1hKfRo-GVro' },
  { title: "The Calabash Kids", author: "Juma", type: 'Folklore', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVEz4UTCpp223l9QRsdxYGf4pegaKfIoxUYdvO2wPo8XCkY1wn0s7omDDuk5l9UfGHmSUMYiZUUiyeVrj5DHh5gKGghBS5J2alPWrLAd8VmA-CBLb7qbiOcvqYtIFuk8Iw9ZjCmIWsqxrq9lXoxaDfBKx3IEbV995TSPyPknJVXq7CE98Xs5Bc97lpSiqftZE4YnDIH4KY3CfDGILDtoz-44vJc1F-kNPQ3hBDDIXf21ifYT-byy_M-5rVvOpQ851C6YS0xkM3lcM' },
  { title: "Why the Sky is Far Away", author: "Efe", type: 'Legend', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-V3E8jEaab6c5oqCwte8YO0FtTA-Q39LF02RVqSEIn-yFIxEXpqQNtov9YUVPsspoTd-G0IBX5eD3D1FcoYuaZ2D_obUh27Cgzr8TPZ-NFxlWutmC2r8AZ1IX4K6AJVN-WZkqrWzUYtGMn9bKxe6QkCpDd7wYm74pmBOZiwy9Z5UBxeeJs2ysKmBaR6jUiNoHpNBP7lzTP6QEx4IL-GexQtsOvMdHpFtTD_Mf778b0wdPEW-lb49hYodddCWGwok-y1Z7z_2zLgA' },
  { title: "The Magic Drum", author: "Kofi", type: 'Fable', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo' }
];

const StoryDetailScreen: React.FC<Props> = ({ navigate, goBack, story, onViewProfile }) => {
  const [showMeaning, setShowMeaning] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeContextWord, setActiveContextWord] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If story is provided via params, use it; otherwise use default (Anansi)
  const activeStory = story || DEFAULT_STORY;
  const isDefaultStory = activeStory.title === DEFAULT_STORY.title;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
    // Reset bookmark state when story changes
    setIsBookmarked(false);
  }, [activeStory.title]);

  const storyUrl = `https://samiati.app/story/${activeStory.title.toLowerCase().replace(/\s+/g, '-')}`;
  const storyTitle = `${activeStory.title} - A Tale of Wisdom from Samiati`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storyUrl).then(() => {
      setToastMessage("Link copied to clipboard!");
      setTimeout(() => setToastMessage(null), 3000);
      setIsShareOpen(false);
    });
  };

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    setToastMessage(!isBookmarked ? "Saved to your collection" : "Removed from collection");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSocialShare = (platform: string) => {
    let url = '';
    const text = encodeURIComponent(storyTitle);
    const link = encodeURIComponent(storyUrl);

    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${text}%20${link}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${text}&url=${link}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${link}`;
        break;
      case 'email':
        url = `mailto:?subject=${text}&body=Check out this story on Samiati: ${link}`;
        break;
    }

    if (url) window.open(url, '_blank');
    setIsShareOpen(false);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProfile({
      name: activeStory.author,
      handle: activeStory.author.toLowerCase().replace(/\s+/g, '_'),
      avatar: activeStory.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDTCkmqfVuPlLQ4IRyL2yV9d82xXGhUn6PZJQuyR-wOR0cvIaU2RmXVEYxrDKRF8LwvPO8ui_vLey4StEqf8CTMHBir5NqJ8BI6X6gXKzW2e5jtCmaOROPdLEoAJCmmFm51ht9zq7QwPnSBQC8TAqlJfRa5M4kLarJ9LqR6i2YIFBkKl3YmSCiPo77SFPw336bJQN6weNdBrPdUlu-Ta6wtwbzNsRkfyTwRr05-OJF-2JEsH1EwbuwH-dLxzpESsJxfK0fBRGIneoQ",
      isGuest: false,
      bio: `Passionately sharing stories from ${activeStory.type.split('•')[1]?.trim() || 'my culture'}.`,
      culturalBackground: activeStory.type.split('•')[1]?.trim() || 'Global',
      location: 'Samiati Community'
    });
  };

  const ContextWord = ({ id, text, explanation }: { id: string, text: string, explanation: string }) => {
    const isActive = activeContextWord === id;

    return (
      <span className="relative inline-block">
        <span
          onClick={(e) => {
            e.stopPropagation();
            setActiveContextWord(isActive ? null : id);
          }}
          className={cn(
            "cursor-pointer border-b-[2px] border-dashed transition-all duration-300 px-0.5 -mx-0.5",
            isActive
              ? 'border-primary text-primary font-black bg-primary/10 rounded-sm'
              : 'border-muted-foreground/30 hover:border-primary hover:text-primary'
          )}
        >
          {text}
        </span>
        {isActive && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-foreground text-background text-xs p-5 rounded-2xl shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-300 font-sans cursor-default border border-background/10 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2 text-primary opacity-80 uppercase tracking-widest font-black text-[9px]">
              <Info className="w-3 h-3" />
              Definition
            </div>
            <p className="leading-relaxed font-medium tracking-tight">{explanation}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-foreground"></div>
          </div>
        )}
      </span>
    );
  };

  return (
    <div
      ref={scrollRef}
      className="flex flex-col h-screen overflow-y-auto bg-background transition-colors duration-300 relative"
      onClick={() => setActiveContextWord(null)}
    >
      {/* Hero Section */}
      <div className="relative h-[400px] w-full shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url('${activeStory.img}')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>

        <header className="absolute top-0 left-0 right-0 flex items-center p-4 justify-between z-30 pt-6 px-6">
          <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full bg-background/20 backdrop-blur-xl border border-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleBookmark}
              className={cn("rounded-full bg-background/20 backdrop-blur-xl border border-white/10 text-white hover:bg-white/20 transition-all", isBookmarked && "text-primary border-primary/30")}
            >
              <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsShareOpen(true); }} className="rounded-full bg-background/20 backdrop-blur-xl border border-white/10 text-white hover:bg-white/20">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 max-w-4xl mx-auto w-full">
          <Badge className="mb-4 bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-[0.2em] px-3 h-6 backdrop-blur-sm">
            {activeStory.type || "Folklore"}
          </Badge>
          <h1 className="text-5xl font-black leading-tight mb-4 text-white tracking-tighter drop-shadow-2xl">{activeStory.title}</h1>

          <div
            className="flex items-center gap-4 group cursor-pointer w-fit p-1 -ml-1 pr-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all"
            onClick={handleAuthorClick}
          >
            <Avatar className="w-12 h-12 rounded-full border-2 border-white/20 group-hover:border-primary transition-colors">
              <AvatarImage src={activeStory.avatar} className="object-cover" />
              <AvatarFallback>{activeStory.author[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-black text-sm text-white tracking-tight group-hover:text-primary transition-colors">{activeStory.author}</span>
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase tracking-widest font-sans">
                <Calendar className="w-3 h-3" /> {activeStory.date || "Just now"} • <Clock className="w-3 h-3" /> {activeStory.readTime || "5 min read"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="px-6 py-8 max-w-3xl mx-auto w-full pb-32">
          {/* Conditional Rendering: If it's the default story, show full rich content. Else show placeholder/summary. */}
          {isDefaultStory ? (
            <div className="prose dark:prose-invert max-w-none text-lg text-stone-800 dark:text-stone-200 leading-relaxed font-serif">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-3 first-letter:float-left mb-6">
                Long ago, <ContextWord id="anansi" text="Kwaku Anansi" explanation="A West African trickster god, often depicted as a spider, known for his wisdom, wit, and ability to outsmart more powerful opponents." />, the spider, was known for his cleverness and his mischief. But in those days, stories did not belong to the people on earth; they belonged to <ContextWord id="nyame" text="Nyame" explanation="The Supreme Being in Akan religion, often referred to as the Sky God who sees all and possesses all wisdom." />, the Sky God.
              </p>
              <p className="mb-6">
                One day, Anansi decided he wanted the stories. He spun a web up to the sky and climbed until he reached Nyame's throne.
              </p>

              {/* Cultural Insight Block */}
              <Card className="my-10 bg-primary/5 border-l-4 border-l-primary p-6 rounded-r-2xl shadow-none group">
                <div className="flex items-center gap-3 mb-3 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                  Cultural Insight
                </div>
                <p className="text-base text-foreground leading-relaxed italic m-0 opacity-80">
                  <span className="font-black text-primary tracking-widest uppercase mr-1">Nyame</span> represents the supreme being in Akan religion. The "Sky God" is often associated with the sun and the moon, watching over all earthly matters.
                </p>
              </Card>

              <p className="mb-6">
                "Oh great Nyame," Anansi called out. "I wish to buy your stories!"
              </p>
              <p className="mb-6">
                Nyame laughed, a sound like rolling thunder. "My stories? They are expensive, little spider. Many great kings have tried to buy them and failed."
              </p>
              <p className="mb-6">
                "Tell me the price," Anansi said confidently.
              </p>

              {/* Proverb Spotlight */}
              <div
                className="my-12 cursor-pointer group"
                onClick={(e) => { e.stopPropagation(); setShowMeaning(showMeaning === 'p1' ? null : 'p1'); }}
              >
                <Card className="relative py-12 px-10 bg-muted/20 rounded-[32px] text-center border-4 border-dashed border-muted-foreground/10 transition-all group-hover:border-primary/30 group-hover:bg-primary/5 active:scale-[0.98] shadow-none">
                  <Quote className="w-12 h-12 text-muted-foreground/20 absolute top-6 left-8 rotate-180 opacity-40" />
                  <p className="text-3xl font-black text-foreground tracking-tighter italic relative z-10 leading-tight">
                    "Tikro nko agyina"
                  </p>
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <Separator className="w-12 h-1 bg-primary/20 rounded-full" />
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 mt-1">
                      <Hand className="w-3.5 h-3.5" />
                      Tap to reveal meaning
                    </p>
                  </div>
                  <Quote className="w-12 h-12 text-muted-foreground/20 absolute bottom-6 right-8 opacity-40" />
                </Card>

                <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showMeaning === 'p1' ? 'max-h-60 opacity-100 mt-6 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
                  <div className="bg-primary text-white p-8 rounded-[24px] shadow-2xl shadow-primary/30 font-sans text-center border-4 border-white/20">
                    <p className="font-black uppercase tracking-[0.2em] text-[10px] mb-3 opacity-70">The Meaning</p>
                    <p className="text-2xl font-black tracking-tight leading-tight">"One head does not go into council."</p>
                    <Separator className="w-10 h-1 bg-white/30 mx-auto my-4 rounded-full" />
                    <p className="text-sm font-medium opacity-90 italic tracking-tight font-serif leading-relaxed">Wisdom is best sought together; two heads are better than one.</p>
                  </div>
                </div>
              </div>

              <p className="mb-6">
                And so, the great quest began. Anansi had to capture the <ContextWord id="python" text="python" explanation="Onini the Python: One of the impossible tasks. Represents a challenge requiring patience and strategy." />, the <ContextWord id="leopard" text="leopard" explanation="Osebo the Leopard: Known for his terrible teeth. Represents a challenge requiring courage to face a fierce opponent." />, and the <ContextWord id="hornets" text="hornets" explanation="Mmmboro the Hornets: Known for their painful sting. Represents a challenge requiring quick wit to handle a swarm of problems." />. Through wit and trickery, rather than strength, the little spider succeeded where the strong had failed. He proved that wisdom is greater than force.
              </p>
              <p>
                From that day on, the stories were given to Anansi to share with the world. That is why we tell them today, weaving our words just as he wove his web.
              </p>
            </div>
          ) : (
            // Placeholder content for other stories
            <div className="prose dark:prose-invert max-w-none text-lg text-stone-800 dark:text-stone-200 leading-relaxed font-serif animate-in fade-in">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-3 first-letter:float-left mb-6">
                This is the story of <span className="font-bold text-stone-900 dark:text-white">{activeStory.title}</span>. It has been passed down through generations, teaching valuable lessons about courage, community, and the human spirit.
              </p>
              <p className="mb-6">
                [Full story content would appear here. Since this is a prototype, please imagine a rich, immersive tale filled with cultural wisdom, vibrant characters, and an engaging plot that reflects the heritage of the storyteller.]
              </p>
              <div className="my-10 bg-muted/20 p-10 rounded-[32px] border border-border/50 text-center space-y-4">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="font-black text-foreground/50 uppercase tracking-[0.2em] text-[10px]">Story Content Loaded</p>
                <p className="text-xl font-bold tracking-tight text-foreground/80">{activeStory.title}</p>
              </div>
              <p>
                The moral of this story resonates even today, reminding us of the importance of listening to our elders and respecting the traditions that bind us together.
              </p>
            </div>
          )}
        </div>

        {/* Audio Player Sticky/Floating */}
        <div className="fixed bottom-8 left-6 right-6 z-40 max-w-2xl mx-auto">
          <Card className="bg-foreground/95 dark:bg-background/95 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border-white/10 text-background flex items-center gap-5 group">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/40 relative overflow-hidden">
              <Headphones className="w-6 h-6 text-white animate-pulse relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/40"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="font-black text-sm truncate tracking-tight text-background">{activeStory.title}</p>
                <span className="text-[10px] font-black font-mono opacity-60">1:17 / 5:00</span>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={33} className="h-1.5 bg-background/20" />
              </div>
              <p className="text-[10px] font-bold text-background/40 uppercase tracking-widest mt-2">Narrated by {activeStory.author.split(' ')[0]}</p>
            </div>
            <Button size="icon" className="w-14 h-14 rounded-full bg-background text-foreground hover:bg-background/90 transition-all shadow-xl active:scale-90 shrink-0">
              <Pause className="w-6 h-6 fill-current" />
            </Button>
          </Card>
        </div>

        <div className="bg-muted/30 border-t border-border p-8 font-sans pb-32">
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground tracking-tight">More from this culture</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Akan Wisdom & Traditions</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(Screen.CONTRIBUTIONS, { initialTab: 'Following', typeFilter: 'Story' })}
              className="text-primary font-black uppercase tracking-widest text-[10px] h-8 rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
            >
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 -mx-8 px-8 no-scrollbar">
            {RELATED_STORIES.map((item) => (
              <Card
                key={item.title}
                onClick={() => navigate(Screen.STORY_DETAIL, { story: item })}
                className="w-64 bg-background border-border/50 rounded-3xl p-4 flex flex-col gap-4 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer shrink-0 group active:scale-[0.98]"
              >
                <div className="h-40 rounded-2xl bg-cover bg-center group-hover:scale-[1.05] transition-transform duration-500 relative overflow-hidden" style={{ backgroundImage: `url('${item.img}')` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent group-hover:from-black/20 transition-all"></div>
                  <Badge className="absolute top-3 left-3 bg-white/20 backdrop-blur-md border-none text-[9px] font-black uppercase tracking-widest text-white">{item.type}</Badge>
                </div>
                <div className="px-1 pb-1">
                  <h4 className="font-black text-base text-foreground line-clamp-2 tracking-tight leading-tight group-hover:text-primary transition-colors">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <span>by {item.author.split(' ')[0]}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Share Sheet */}
      <Sheet open={isShareOpen} onOpenChange={setIsShareOpen}>
        <SheetContent side="bottom" className="rounded-t-[32px] p-8 border-none bg-background/95 backdrop-blur-2xl">
          <SheetHeader className="mb-8">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6 opacity-40"></div>
            <SheetTitle className="text-2xl font-black text-center tracking-tighter">Share this story</SheetTitle>
            <p className="text-center text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">Spread the wisdom</p>
          </SheetHeader>

          <div className="grid grid-cols-4 gap-6 mb-10 max-w-md mx-auto">
            {[
              { name: 'WhatsApp', icon: <MessageCircle className="w-6 h-6" />, color: 'bg-green-500', action: () => handleSocialShare('whatsapp') },
              { name: 'Twitter', icon: <Twitter className="w-6 h-6" />, color: 'bg-sky-500', action: () => handleSocialShare('twitter') },
              { name: 'Facebook', icon: <Facebook className="w-6 h-6" />, color: 'bg-blue-600', action: () => handleSocialShare('facebook') },
              { name: 'Email', icon: <Mail className="w-6 h-6" />, color: 'bg-stone-500', action: () => handleSocialShare('email') },
            ].map((platform) => (
              <button key={platform.name} onClick={platform.action} className="flex flex-col items-center gap-3 group">
                <div className={cn(
                  "w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300",
                  platform.color
                )}>
                  {platform.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{platform.name}</span>
              </button>
            ))}
          </div>

          <div className="bg-muted/30 p-4 rounded-[20px] flex items-center gap-4 border border-border/50 max-w-md mx-auto group">
            <Link2 className="w-5 h-5 text-muted-foreground/40" />
            <input
              type="text"
              value={storyUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-foreground font-medium outline-none truncate"
            />
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyLink}
              className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest h-9 rounded-xl px-4 shadow-lg shadow-primary/20"
            >
              Copy Link
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Toast Notification */}
      <div className={cn(
        "fixed top-10 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 transition-all duration-500 z-[60] border border-background/20 backdrop-blur-md",
        toastMessage ? "translate-y-0 opacity-100 scale-100" : "-translate-y-10 opacity-0 scale-90 pointer-events-none"
      )}>
        <CheckCircle2 className="w-5 h-5 text-primary" />
        <p className="font-black text-[11px] uppercase tracking-[0.2em]">{toastMessage}</p>
      </div>
    </div>
  );
};

export default StoryDetailScreen;

