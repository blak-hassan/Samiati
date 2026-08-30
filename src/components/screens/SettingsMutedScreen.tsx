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

type MutedWord = {
  _id: string;
  word: string;
  createdAt: number;
};

const SettingsMutedScreen: React.FC<Props> = ({ goBack }) => {
  const { toast } = useToast();
  const mutedWords = useQuery(api.settings.mutations.listMutedWords) as MutedWord[] | undefined;
  const addMutation = useMutation(api.settings.mutations.addMutedWord);
  const removeMutation = useMutation(api.settings.mutations.removeMutedWord);
  const [newWord, setNewWord] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    setIsAdding(true);
    try {
      const result = await addMutation({ word: newWord.trim() });
      if (result.alreadyMuted) {
        toast("Word is already muted", "info");
      } else {
        toast("Word added to muted list", "success");
      }
      setNewWord('');
    } catch {
      toast("Failed to add muted word", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsRemoving(true);
    try {
      await removeMutation({ word: deleteTarget });
      toast("Word removed from muted list", "success");
      setDeleteTarget(null);
    } catch {
      toast("Failed to remove muted word", "error");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <SettingsPageHeader title="Muted Words" onBack={goBack} />

      <main className="flex-1 p-4 space-y-6">
        <div className="flex gap-2">
            <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWord(); } }}
                placeholder="Add word or phrase..."
                className="flex-1 bg-muted/20 border border-border/50 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
            />
            <Button
                onClick={handleAddWord}
                disabled={!newWord.trim() || isAdding}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl font-bold"
            >
                {isAdding ? "Adding..." : "Add"}
            </Button>
        </div>

        <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            {mutedWords && mutedWords.length > 0 ? (
                mutedWords.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-4 border-b border-border/30 last:border-0">
                        <span className="font-medium text-foreground">{item.word}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(item.word)}
                            disabled={isRemoving}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Delete ${item.word}`}
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </Button>
                    </div>
                ))
            ) : (
              <EmptyState
                icon={<span className="material-symbols-outlined text-4xl">volume_off</span>}
                title="No words muted."
                description="Add words or phrases you'd like to hide from your timeline."
              />
            )}
        </div>

        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
            <p className="text-xs text-foreground">
                Posts containing these words will be hidden from your timeline. Muting is not case-sensitive.
            </p>
        </div>
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !isRemoving && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove muted word?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget}&quot; will no longer be muted. Posts containing this word may appear in your timeline again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isRemoving}>
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsMutedScreen;
