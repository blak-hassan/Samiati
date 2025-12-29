"use client";
import React, { useState, useEffect } from 'react';
import { Screen } from '@/types';
import {
  Lock,
  ChevronUp,
  Volume2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  User as UserIcon
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

const VideoCallScreen: React.FC<Props> = ({ goBack, chatUser }) => {
  const [callStatus, setCallStatus] = useState('Ringing...');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    // Simulate connection
    const connectTimer = setTimeout(() => {
      setCallStatus('Connected');
    }, 2500);

    // Timer
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
    <div className="flex flex-col h-screen bg-stone-900 relative overflow-hidden">
      {/* Background / Main Video Feed */}
      <div className="absolute inset-0 z-0">
        <img
          src={chatUser.avatar}
          alt="Video Feed"
          className="w-full h-full object-cover opacity-60 blur-sm scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>

      {/* Header info */}
      <div className="relative z-10 flex flex-col items-center pt-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
          <Lock className="text-white/70 w-3 h-3" />
          <span className="text-white/70 text-[10px] uppercase font-bold tracking-[0.1em]">End-to-end encrypted</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight">{chatUser.name}</h1>
        <div className="flex items-center gap-2 text-white/90 font-bold bg-black/10 px-4 py-1 rounded-full backdrop-blur-sm border border-white/5">
          {callStatus === 'Connected' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          <span className="tracking-widest">
            {callStatus === 'Connected' ? formatTime(duration) : callStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Self View (Picture in Picture) */}
      <div className="absolute bottom-36 right-6 w-32 h-44 bg-stone-900/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-20 group transition-transform hover:scale-105 duration-300">
        <div className="w-full h-full flex items-center justify-center relative">
          <UserIcon className="text-white/20 w-12 h-12" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/80 uppercase tracking-tighter">You</span>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-30 mt-auto pb-12 px-6">
        <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white mb-2 animate-bounce rounded-full">
            <ChevronUp className="w-6 h-6" />
          </Button>

          <div className="bg-stone-950/60 backdrop-blur-2xl rounded-[32px] p-4 w-full flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50" />

            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95"
            >
              <Volume2 className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn(
                "h-14 w-14 rounded-full transition-all active:scale-95",
                isVideoOff ? "bg-white text-stone-950" : "bg-white/5 hover:bg-white/10 text-white"
              )}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "h-14 w-14 rounded-full transition-all active:scale-95",
                isMuted ? "bg-white text-stone-950" : "bg-white/5 hover:bg-white/10 text-white"
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
    </div>
  );
};

export default VideoCallScreen;

