"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import { Screen, User } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Key, Fingerprint, Download, Trash2, Smartphone, KeyRound, Mail, Edit3 } from "lucide-react";
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
import SettingsRow from "@/components/settings/SettingsRow";
import SettingsGroup from "@/components/settings/SettingsGroup";

interface Props {
  user: User;
  navigate: (screen: Screen) => void;
}

const SettingsAccountScreen: React.FC<Props> = ({ user, navigate }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const deleteAccountMutation = useMutation(api.users.mutations.deleteAccount);
  const profile = useQuery(api.users.queries.getProfile, {});
  const exportDataQuery = useQuery(api.users.mutations.exportUserData, isExporting ? {} : "skip");

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccountMutation();
      toast("Account deleted successfully.", "success");
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast("Failed to delete account. Please try again.", "error");
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  useEffect(() => {
    if (!isExporting || !exportDataQuery) return;
    try {
      const data = exportDataQuery;
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
      setSavedAt(Date.now());
    } catch (error) {
      console.error("Failed to export data:", error);
      toast("Failed to export data. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, exportDataQuery, toast]);

  const handleExportData = () => {
    setIsExporting(true);
  };

  // Surface a transient saved indicator in the shell header via a custom event.
  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2200);
    return () => clearTimeout(t);
  }, [savedAt]);

  return (
    <div className="space-y-6">
      {/* Identity */}
      <SettingsGroup title="Profile" description="How you appear across Samiati.">
        <button
          type="button"
          onClick={() => navigate(Screen.EDIT_PROFILE)}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/30 transition-colors"
        >
          <Avatar className="w-12 h-12 border-2 border-background shadow-md">
            <AvatarImage src={user.avatar} className="object-cover" />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground font-medium">Edit name, bio, languages</p>
          </div>
          <Edit3 className="w-4 h-4 text-muted-foreground" />
        </button>
      </SettingsGroup>

      {/* Identity details */}
      <SettingsGroup title="Identity">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
            <p className="text-sm font-bold text-foreground truncate">{profile?.email ?? "—"}</p>
          </div>
        </div>
        <CulturalBackgroundField user={user} onSaved={() => setSavedAt(Date.now())} />
      </SettingsGroup>

      {/* Security */}
      <SettingsGroup title="Security">
        <SettingsRow
          icon={<KeyRound className="w-4 h-4" />}
          label="Change password"
          description="Update your sign-in password"
          onClick={() => navigate(Screen.CHANGE_PASSWORD)}
        />
        <button
          type="button"
          onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
          className="group w-full flex items-center gap-3 px-4 min-h-14 hover:bg-muted/30 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Fingerprint className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-foreground">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground font-medium">Require a second factor at sign-in</p>
          </div>
          <span className={`text-xs font-bold ${twoFactorEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>
            {twoFactorEnabled ? 'On' : 'Off'}
          </span>
        </button>
        <SettingsRow
          icon={<Smartphone className="w-4 h-4" />}
          label="Where you're signed in"
          description="This device"
        />
      </SettingsGroup>

      {/* Data */}
      <SettingsGroup title="Data">
        <SettingsRow
          icon={<Download className="w-4 h-4" />}
          iconClassName="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
          label="Download my data"
          description="Export everything as JSON (GDPR)"
          trailing={isExporting ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : undefined}
          onClick={handleExportData}
        />
        <SettingsRow
          icon={<Trash2 className="w-4 h-4" />}
          label="Delete account"
          description="Permanently remove all your data"
          destructive
          onClick={() => setShowDeleteDialog(true)}
        />
      </SettingsGroup>

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

const CulturalBackgroundField: React.FC<{ user: User; onSaved?: () => void }> = ({ user, onSaved }) => {
  const updateProfileMutation = useMutation(api.users.mutations.updateProfile);
  const { toast } = useToast();
  const [value, setValue] = useState(user.culturalBackground || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfileMutation({ culturalBackground: value });
      toast("Cultural background updated", "success");
      onSaved?.();
    } catch {
      toast("Failed to update cultural background", "error");
    } finally {
      setSaving(false);
    }
  };

  const dirty = value !== (user.culturalBackground || '');

  return (
    <div className="px-4 py-3">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
        Cultural background
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g., Kenyan, Yoruba, Zulu..."
        rows={2}
        className="w-full bg-muted/40 p-3 rounded-xl text-foreground border border-border/60 focus:border-primary outline-none transition-colors resize-none text-sm"
      />
      {dirty && (
        <button
          type="button"
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
