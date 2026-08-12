"use client";

import React, { useState, useRef, useEffect } from 'react';
import { NavigateFn, Screen, Message } from '@/types';
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Plus,
  Smile,
  Send,
  Mic,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Camera
} from "lucide-react";
import { useUploadFile } from '@/hooks/useUploadFile';

interface Props {
  navigate: NavigateFn;
  goBack: () => void;
  chatId?: string;
  chatUser?: {
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  initialMessages?: Message[];
  onSendMessage?: (text: string, imageStorageId?: string) => Promise<void>;
}

const DirectMessageScreen: React.FC<Props> = ({ navigate, goBack, chatId, chatUser, initialMessages, onSendMessage }) => {
  const [activeChatId, setActiveChatId] = useState<string | null>(chatId || null);
  const [messages, setMessages] = useState<Message[]>(() => initialMessages || []);
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { upload, isUploading } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Note Simulation
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const attachmentRef = useRef<HTMLDivElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  /* Mock Init logic removed - reliance on parent for data */
  /*
  useEffect(() => {
    // ...
  }, [chatId, chatUser, activeChatId]);
  */

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (attachmentRef.current && !attachmentRef.current.contains(event.target as Node)) {
        setIsAttachmentOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (type: 'text' | 'image' | 'voice' = 'text', content: string = inputText, duration?: string) => {
    if (type === 'text' && !content.trim()) return;

    if (onSendMessage && type === 'text') {
      await onSendMessage(content);
      setInputText('');
    } else if (type === 'image') {
      // Image sending is handled by handleImageSend
      return;
    } else {
      // Voice note fallback
      console.log("Voice sending not fully wired yet", type, content);
      setMessages(prev => [...prev, {
        id: 'optimistic-' + Date.now(),
        text: content,
        sender: 'user',
        timestamp: new Date(),
        type: type
      }]);
      setInputText('');
    }

    setIsAttachmentOpen(false);
  };

  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSendMessage) return;

    const storageId = await upload(file);
    if (storageId) {
      await onSendMessage('Photo', storageId);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsAttachmentOpen(false);
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      // Stop & Send
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      const mins = Math.floor(recordingDuration / 60);
      const secs = recordingDuration % 60;
      const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

      handleSend('voice', 'Voice Message', durationStr);
      setIsRecording(false);
      setRecordingDuration(0);
    } else {
      // Start
      setIsRecording(true);
      setRecordingDuration(0);
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const formatRecDuration = () => {
    const mins = Math.floor(recordingDuration / 60);
    const secs = recordingDuration % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return <CheckCheck className="w-3 h-3 text-rasta-green" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-muted-foreground/50" />;
      case 'sent': return <Check className="w-3 h-3 text-muted-foreground/50" />;
      default: return null;
    }
  };

  const user = chatUser || { name: 'Chat', avatar: '', isOnline: false };
  const displayMessages = initialMessages || messages;

  return (
    <div className="flex flex-col h-full bg-stone-100 dark:bg-background transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10 shadow-sm">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-muted flex items-center text-foreground gap-1 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <div className="relative ml-1">
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-background" />
            {user.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse"></span>}
          </div>
        </button>
        <div className="flex-1 ml-3">
          <h1 className="text-base font-bold text-foreground leading-tight">{user.name}</h1>
          <p className="text-xs text-muted-foreground font-medium">{user.isOnline ? 'Active now' : 'Last seen recently'}</p>
        </div>
      </header>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2 relative"
        ref={scrollRef}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

{displayMessages.map((msg) => (
          <div key={msg.id} className={cn("flex w-full relative z-1", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl p-3 shadow-sm text-sm relative group mb-1 transition-all",
                msg.type === 'image' ? "p-1" : "",
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-[2px]'
                  : 'bg-background text-foreground rounded-bl-[2px] border border-border'
              )}
            >
              {/* Image Message */}
              {msg.type === 'image' && (
                <div className="mb-1">
                  <div className="w-64 h-48 bg-stone-300 rounded-lg flex items-center justify-center text-stone-500">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                  </div>
                </div>
              )}

              {/* Voice Message */}
              {msg.type === 'voice' && (
                <div className="flex items-center gap-3 pr-2 py-1 min-w-[160px]">
                  <button className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.sender === 'user' ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                  )}>
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-current border-b-[5px] border-b-transparent ml-1"></div>
                  </button>
                  <div className="flex flex-col gap-1 w-full">
                    <div className={cn("h-1 w-full rounded-full", msg.sender === 'user' ? "bg-white/30" : "bg-stone-200")}>
                      <div className={cn("h-full w-1/3 rounded-full", msg.sender === 'user' ? "bg-white" : "bg-stone-500")}></div>
                    </div>
                    <span className="text-[10px] opacity-80 font-mono">{msg.duration || '0:30'}</span>
                  </div>
                  <Mic className={cn("w-4 h-4 opacity-50", msg.sender === 'user' ? "text-white" : "text-stone-400")} />
                </div>
              )}

              {/* Text Message */}
              {msg.type === 'text' && (
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              )}

              <div className={cn(
                "flex justify-end items-center gap-1 text-[10px] mt-0.5",
                msg.type === 'image' ? "absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 rounded-full text-white backdrop-blur-sm" : "",
                msg.sender === 'user' ? 'text-white/80' : 'text-stone-500 dark:text-text-muted'
              )}>
                <span>{msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : String(msg.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl rounded-bl-none shadow-sm border border-stone-100 dark:border-white/5 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-typing-dot" style={{ animationDelay: '-0.3s' }}></span>
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-typing-dot" style={{ animationDelay: '-0.15s' }}></span>
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-typing-dot"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-background border-t border-border flex items-end gap-2 sticky bottom-0 z-10 shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageSend}
        />
        <div ref={attachmentRef} className="relative">
          <button
            onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
            className={cn(
              "p-2 rounded-full transition-all duration-300",
              isAttachmentOpen
                ? "bg-muted text-foreground rotate-45"
                : "text-muted-foreground hover:bg-muted hover:text-primary"
            )}
          >
            <Plus className="w-6 h-6" />
          </button>
          {isAttachmentOpen && (
            <div className="absolute bottom-14 left-0 flex flex-col gap-2 p-2 bg-background shadow-xl rounded-xl border border-border animate-in fade-in slide-in-from-bottom-4 z-50 min-w-[180px]">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors text-sm font-medium text-foreground disabled:opacity-50"
              >
                <ImageIcon className="w-5 h-5 text-rasta-gold" />
                {isUploading ? 'Uploading...' : 'Photos & Videos'}
              </button>
              <button
                onClick={() => { }}
                className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors text-sm font-medium text-foreground"
              >
                <Camera className="w-5 h-5 text-rasta-red" />
                Camera
              </button>
              <button
                onClick={() => { }}
                className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors text-sm font-medium text-foreground"
              >
                <FileText className="w-5 h-5 text-rasta-green" />
                Document
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 bg-muted/50 rounded-2xl flex items-center min-h-[44px] px-3 py-1 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-all mb-1 shadow-sm">
          <button className="p-1.5 text-muted-foreground hover:text-primary rounded-full transition-colors">
            <Smile className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground px-2 py-1"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
        </div>

        <button
          onClick={() => inputText.trim() ? handleSend() : handleRecordToggle()}
          className={cn(
            "p-3 rounded-full flex items-center justify-center transition-all duration-300 mb-1 hover:scale-105 active:scale-95 shadow-md",
            inputText.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {inputText.trim() ? <Send className="w-5 h-5 ml-0.5" /> : <Mic className={cn("w-5 h-5", isRecording && "animate-pulse")} />}
        </button>

        {isRecording && (
          <div className="absolute left-16 bottom-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-mono font-bold animate-in fade-in">
            {formatRecDuration()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessageScreen;

