"use client";

import React, { useState } from 'react';
import { Screen, User } from '@/types';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ChevronRight, Trash2, Key, Fingerprint } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  user: User;
}

const SettingsAccountScreen: React.FC<Props> = ({ navigate, goBack, user }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="flex items-center px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground ml-2 tracking-tight">Account</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-muted/20 rounded-2xl border border-border/50 p-4 flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatar} className="object-cover" />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full border-2 border-background hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
          <div className="text-center">
            <h2 className="font-bold text-foreground text-lg">{user.name}</h2>
            <p className="text-muted-foreground text-sm">{user.handle}</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Username</label>
            <input type="text" value={user.handle.replace('@', '')} readOnly className="w-full bg-muted/50 p-3 rounded-xl text-foreground border border-transparent focus:border-primary outline-none transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Email</label>
            <input type="email" value="user@example.com" readOnly className="w-full bg-muted/50 p-3 rounded-xl text-foreground border border-transparent focus:border-primary outline-none transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Phone</label>
            <input type="tel" value="+254 712 345 678" readOnly className="w-full bg-muted/50 p-3 rounded-xl text-foreground border border-transparent focus:border-primary outline-none transition-colors" />
          </div>
        </div>

        {/* Security */}
        <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
          <button onClick={() => navigate(Screen.CHANGE_PASSWORD)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Change Password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </button>
          <button 
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group"
          >
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Two-Factor Authentication</span>
            </div>
            <span className={`text-xs font-medium ${twoFactorEnabled ? 'text-rasta-green' : 'text-muted-foreground'}`}>
              {twoFactorEnabled ? 'On' : 'Off'}
            </span>
          </button>
          <button 
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors text-destructive group"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              <span className="font-bold">Delete Account</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. All your data, contributions, and saved content will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsAccountScreen;
