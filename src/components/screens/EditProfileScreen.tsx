import React from 'react';
import { Screen } from '@/types';
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  Minus,
  Plus,
  ArrowRight,
  Globe,
  User as UserIcon,
  Mail,
  Shield,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const EditProfileScreen: React.FC<Props> = ({ navigate, goBack }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="flex items-center p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-md z-30">
        <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="flex-1 text-center text-lg font-bold text-foreground pr-8 tracking-tight">Edit Profile</h2>
      </header>

      <main className="flex-1 p-6 pb-24 max-w-2xl mx-auto w-full">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-background ring-2 ring-primary/20 shadow-xl group-hover:scale-105 transition-transform duration-500">
              <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwIbRrqJ4ZJ8GZcDvg3A8ICBI_glwNU2kT-sFW7-8qY1XYmEp5OPUPcOp1LTcTEL-9WOzc1bMxyURmWkWyrBOe5qFmcJy1VwLlI3U2fRprY3C452LNhCV5ucydy-MWIfij3s9wB7Womu3RmxEVpEBd6YW7i0ty-O2kqgzw4oYkynhtJWwuEqnWs0dyjiruGe25Bcsxd76N3hCs8K0KoGsEYyeM8qS63xvzlpMaTz-GZK-kI1D7zM4blUhv-JzuvkPJODszYC07wbc" className="object-cover" />
              <AvatarFallback className="text-4xl text-muted-foreground bg-muted">AD</AvatarFallback>
            </Avatar>
            <Button size="icon" className="absolute bottom-0 right-0 h-10 w-10 border-4 border-background rounded-full shadow-lg">
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" className="h-9 px-4 rounded-full font-bold text-xs uppercase tracking-widest gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
            Change Photo
          </Button>
        </div>

        {/* Form Fields */}
        <div className="space-y-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
            <Input defaultValue="Amina Diallo" className="h-12 bg-muted/30 border-border/50 rounded-xl px-4 font-bold text-foreground focus-visible:ring-primary/20" placeholder="Enter your full name" />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cultural Background</Label>
            <div className="relative">
              <select className="w-full bg-muted/30 border border-border/50 rounded-xl h-12 px-4 text-foreground font-bold appearance-none focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                <option>Maasai</option>
                <option>Zulu</option>
                <option>Berber</option>
                <option>Ashanti</option>
                <option>Fulani</option>
              </select>
              <ChevronDown className="absolute right-4 top-4 text-muted-foreground pointer-events-none w-4 h-4" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Language Masteries</h3>
              <Separator className="flex-1" />
            </div>

            {/* Primary Language */}
            <div className="bg-muted/30 rounded-2xl p-5 border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Primary Language</Label>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] font-bold tracking-widest h-5">FLUENT</Badge>
              </div>
              <div className="relative">
                <select className="w-full bg-background border border-border/50 rounded-xl h-11 px-4 text-foreground font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20">
                  <option>Swahili</option>
                  <option>Yoruba</option>
                  <option>English</option>
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-muted-foreground pointer-events-none w-4 h-4" />
              </div>
              <div className="flex bg-muted p-1 rounded-xl">
                <Button variant="ghost" className="flex-1 h-9 rounded-lg text-xs font-bold text-muted-foreground hovrer:bg-background">Beginner</Button>
                <Button variant="ghost" className="flex-1 h-9 rounded-lg text-xs font-bold text-muted-foreground hover:bg-background">Intermediate</Button>
                <Button variant="secondary" className="flex-1 h-9 rounded-lg text-xs font-bold bg-background shadow-sm hover:bg-background">Fluent</Button>
              </div>
            </div>

            {/* Secondary Language */}
            <div className="bg-muted/30 rounded-2xl p-5 border border-border/50 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-1 bg-orange-500/20" />
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Secondary Language</Label>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive">
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
              <div className="relative">
                <select className="w-full bg-background border border-border/50 rounded-xl h-11 px-4 text-foreground font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20">
                  <option>Yoruba</option>
                  <option>Swahili</option>
                  <option>English</option>
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-muted-foreground pointer-events-none w-4 h-4" />
              </div>
              <div className="flex bg-muted p-1 rounded-xl">
                <Button variant="ghost" className="flex-1 h-9 rounded-lg text-xs font-bold text-muted-foreground">Beginner</Button>
                <Button variant="secondary" className="flex-1 h-9 rounded-lg text-xs font-bold bg-background shadow-sm hover:bg-background">Intermediate</Button>
                <Button variant="ghost" className="flex-1 h-9 rounded-lg text-xs font-bold text-muted-foreground">Fluent</Button>
              </div>
            </div>

            <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 gap-2 font-black text-xs uppercase tracking-widest transition-all hover:bg-muted/50">
              <Plus className="w-4 h-4" />
              Add Another Language
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate(Screen.CHANGE_PASSWORD)}
            className="w-full justify-between h-14 rounded-2xl text-orange-600 dark:text-orange-400 font-bold hover:bg-orange-500/5 group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span>Change Password</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </main>

      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md p-6 border-t border-border z-40 space-y-3">
        <Button className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
        <Button
          variant="ghost"
          onClick={goBack}
          className="w-full h-12 rounded-xl text-muted-foreground font-bold"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditProfileScreen;
