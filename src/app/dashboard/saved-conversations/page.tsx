"use client";

import React, { useCallback } from "react";
import SavedConversationsScreen from "@/components/screens/SavedConversationsScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAppUser } from "@/hooks/useAppUser";
import { useSyncedConversations } from "@/hooks/useSyncedConversations";
import { exportAllConversations } from "@/lib/exportConversation";
import { mergeImportedConversations, parseImportedConversations } from "@/lib/conversationImport";

export default function SavedConversationsPage() {
    const { navigate } = useNavigation();
    const { user: clerkUser, isLoaded } = useAppUser();
    const suggestTitleAction = useAction(api.conversations.actions.suggestTitle);

    const {
        conversations,
        setConversations,
        readConversations,
        updateConversation,
        syncMetadata,
        syncDelete,
        uploadConversations,
    } = useSyncedConversations({ isSignedIn: !!clerkUser });

    const handleRenameConversation = useCallback((id: string, newTitle: string) => {
        updateConversation(id, { title: newTitle });
        syncMetadata(id, { title: newTitle });
    }, [updateConversation, syncMetadata]);

    const handlePin = useCallback((id: string, isPinned: boolean) => {
        syncMetadata(id, { isPinned });
    }, [syncMetadata]);

    const handleArchive = useCallback((id: string, isArchived: boolean) => {
        syncMetadata(id, { isArchived });
    }, [syncMetadata]);

    const handleSuggestTitle = useCallback(async (id: string): Promise<string | null> => {
        const conversation = readConversations().find((c) => c.id === id);
        if (!conversation || !clerkUser) return null;
        try {
            const result = await suggestTitleAction({
                messages: (conversation.messages ?? []).map((m) => ({
                    sender: m.sender,
                    text: m.text,
                })),
            });
            if (result?.title) {
                updateConversation(id, { title: result.title });
                syncMetadata(id, { title: result.title });
                return result.title;
            }
            return null;
        } catch (err) {
            console.error("Failed to suggest title:", err);
            return null;
        }
    }, [readConversations, clerkUser, suggestTitleAction, updateConversation, syncMetadata]);

    const handleDeleteOne = useCallback((id: string) => {
        syncDelete(id);
    }, [syncDelete]);

    const handleDeleteMany = useCallback((ids: string[]) => {
        for (const id of ids) syncDelete(id);
    }, [syncDelete]);

    const handleArchiveMany = useCallback((ids: string[], isArchived: boolean) => {
        for (const id of ids) syncMetadata(id, { isArchived });
    }, [syncMetadata]);

    const handlePinMany = useCallback((ids: string[], isPinned: boolean) => {
        for (const id of ids) syncMetadata(id, { isPinned });
    }, [syncMetadata]);

    const handleContinueLast = useCallback(() => {
        const last = [...conversations].sort((a, b) => b.lastActive - a.lastActive)[0];
        if (last) navigate(Screen.HOME_CHAT, { chatId: last.id });
    }, [conversations, navigate]);

    const handleExportAll = useCallback(() => {
        exportAllConversations(readConversations());
    }, [readConversations]);

    const handleImport = useCallback(async (file: File): Promise<number> => {
        const text = await file.text();
        const imported = parseImportedConversations(text);
        const merged = mergeImportedConversations(readConversations(), imported);
        setConversations(merged);
        const importedIds = new Set(imported.map((c) => c.id));
        uploadConversations(merged.filter((c) => importedIds.has(c.id)));
        return imported.length;
    }, [readConversations, setConversations, uploadConversations]);

    return (
        <SavedConversationsScreen
            navigate={navigate}
            goBack={() => navigate(Screen.HOME_CHAT)}
            conversations={conversations}
            setConversations={setConversations}
            onChatSelect={(id: string) => navigate(Screen.HOME_CHAT, { chatId: id })}
            onRename={handleRenameConversation}
            onPin={handlePin}
            onArchive={handleArchive}
            onSuggestTitle={isLoaded && clerkUser ? handleSuggestTitle : undefined}
            onDeleteOne={handleDeleteOne}
            onDeleteMany={handleDeleteMany}
            onArchiveMany={handleArchiveMany}
            onPinMany={handlePinMany}
            onContinueLast={handleContinueLast}
            hasAnyConversation={conversations.length > 0}
            onExportAll={handleExportAll}
            onImportSessions={handleImport}
        />
    );
}
