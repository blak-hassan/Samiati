"use client";

import React, { useState } from 'react';
import { Screen, User } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Trash2, Key, Fingerprint, Download } from "lucide-react";
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
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/useToast";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  user: User;
}

const SettingsAccountScreen: React.FC<Props> = ({ navigate, goBack, user }) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const deleteAccountMutation = useMutation(api.users.mutations.deleteAccount);
  const exportDataQuery = useQuery(api.users.mutations.exportUserData, {});

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccountMutation();
      toast(`Account deleted. ${result.deletedRecords} records removed.`, "success");
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast("Failed to delete account. Please try again.", "error");
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportDataQuery;
      if (!data) {
        toast("Failed to load data for export.", "error");
        setIsExporting(false);
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `samiati-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("Data exported successfully.", "success");
    } catch (error) {
      console.error("Failed to export data:", error);
      toast("Failed to export data. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <SettingsPageHeader title="Account" onBack={goBack} />

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
          <CulturalBackgroundField user={user} />
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
        </div>

        {/* Data & Privacy */}
        <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
          <button 
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-medium text-foreground">Download My Data</span>
                <p className="text-xs text-muted-foreground">Export all your data (GDPR)</p>
              </div>
            </div>
            {isExporting ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            )}
          </button>
          <button 
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors text-destructive group"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              <div>
                <span className="font-bold">Delete Account</span>
                <p className="text-xs text-muted-foreground">Permanently remove all your data</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => !open && !isDeleting && setShowDeleteDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. All your data, contributions, and saved content will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CulturalBackgroundField: React.FC<{ user: User }> = ({ user }) => {
  const updateProfileMutation = useMutation(api.users.mutations.updateProfile);
  const { toast } = useToast();
  const [value, setValue] = useState(user.culturalBackground || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfileMutation({ culturalBackground: value });
      toast("Cultural background updated", "success");
    } catch {
      toast("Failed to update cultural background", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Cultural Background</label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g., Kenyan, Yoruba, Zulu..."
        rows={2}
        className="w-full bg-muted/50 p-3 rounded-xl text-foreground border border-transparent focus:border-primary outline-none transition-colors resize-none text-sm"
      />
      {value !== (user.culturalBackground || '') && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  );
};

export default SettingsAccountScreen;
