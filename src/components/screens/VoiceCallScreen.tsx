import React, { useState, useEffect } from 'react';
import { Screen } from '@/types';
import {
  Lock,
  Volume2,
  Video,
  Mic,
  MicOff,
  PhoneOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Props {
  goBack: () => void;
  chatUser: {
    name: string;
    avatar: string;
  };
}

const VoiceCallScreen: React.FC<Props> = ({ goBack, chatUser }) => {
  const [callStatus, setCallStatus] = useState('Ringing...');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus('Connected');
    }, 2000);

    const durationTimer = setInterval(() => {
      if (callStatus === 'Connected') {
        setDuration(prev => prev + 1);
      }
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(durationTimer);
    };
  }, [callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-screen bg-deep-brown text-white relative overflow-hidden items-center justify-between py-12">

      <div className="flex flex-col items-center gap-8 mt-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
          <Lock className="w-3 h-3 text-white/50" />
          <span className="text-white/50 text-[10px] uppercase font-bold tracking-[0.1em]">End-to-end encrypted</span>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <Avatar className="w-40 h-40 border-4 border-white/10 shadow-2xl relative z-10 transition-transform duration-500 hover:scale-105">
            <AvatarImage src={chatUser.avatar} className="object-cover" />
            <AvatarFallback className="text-4xl font-bold">{chatUser.name[0]}</AvatarFallback>
          </Avatar>
        </div>

        <div className="text-center space-y-2 relative z-10">
          <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">{chatUser.name}</h1>
          <div className="flex items-center justify-center gap-2 text-white/70 font-bold bg-white/5 px-4 py-1 rounded-full backdrop-blur-sm border border-white/5">
            {callStatus === 'Connected' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            <span className="tracking-widest capitalize">
              {callStatus === 'Connected' ? formatTime(duration) : callStatus.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm px-6 mb-12 relative z-20">
        <div className="bg-white/5 backdrop-blur-2xl rounded-[32px] p-4 flex justify-around items-center border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={cn(
              "h-14 w-14 rounded-full transition-all active:scale-95",
              isSpeaker ? "bg-white text-stone-900" : "bg-white/5 hover:bg-white/10 text-white"
            )}
          >
            <Volume2 className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95"
          >
            <Video className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "h-14 w-14 rounded-full transition-all active:scale-95",
              isMuted ? "bg-white text-stone-900" : "bg-white/5 hover:bg-white/10 text-white"
            )}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={goBack}
            className="h-16 w-16 rounded-full shadow-2xl shadow-red-500/30 transform hover:scale-110 active:scale-90 transition-all duration-300"
          >
            <PhoneOff className="w-7 h-7" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallScreen;
