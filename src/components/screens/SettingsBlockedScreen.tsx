"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import EmptyState from "@/components/settings/EmptyState";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/useToast";

interface Props {
  goBack: () => void;
}

type BlockedUser = {
  _id: string;
  name: string;
  handle: string;
  avatar: string;
  blockedAt: number;
};

const SettingsBlockedScreen: React.FC<Props> = ({ goBack }) => {
  const { toast } = useToast();
  const blockedUsers = useQuery(api.settings.mutations.listBlockedUsers) as BlockedUser[] | undefined;
  const unblockMutation = useMutation(api.settings.mutations.unblockUser);
  const [unblockTarget, setUnblockTarget] = useState<string | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const handleUnblock = async () => {
    if (!unblockTarget) return;
    setIsUnblocking(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await unblockMutation({ blockedUserId: unblockTarget as any });
      toast("User unblocked", "success");
      setUnblockTarget(null);
    } catch {
      toast("Failed to unblock user", "error");
    } finally {
      setIsUnblocking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <SettingsPageHeader title="Blocked Accounts" onBack={goBack} />

      <main className="flex-1 p-4 space-y-4">
        {!blockedUsers ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blockedUsers.length > 0 ? (
          blockedUsers.map((user) => (
            <div key={user._id} className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/50">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-stone-200" loading="lazy" decoding="async" />
                <div>
                  <p className="font-bold text-foreground text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.handle}</p>
                </div>
              </div>
              <Button
                onClick={() => setUnblockTarget(user._id)}
                disabled={isUnblocking}
                className="bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 text-stone-900 dark:text-white text-xs font-bold rounded-lg"
              >
                Unblock
              </Button>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<span className="material-symbols-outlined text-4xl">block</span>}
            title="You haven't blocked anyone yet."
            description="Blocked accounts will not be able to see your profile, posts, or message you."
          />
        )}
        <p className="text-xs text-muted-foreground px-2">
            Blocked accounts will not be able to see your profile, posts, or message you. They will not be notified that you blocked them.
        </p>
      </main>

      <AlertDialog open={!!unblockTarget} onOpenChange={(open) => !open && !isUnblocking && setUnblockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock this account?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to see your profile and message you again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnblocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock} disabled={isUnblocking}>
              {isUnblocking ? "Unblocking..." : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsBlockedScreen;
