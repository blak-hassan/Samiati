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
        syncMetadataMany,
        syncDeleteMany,
        uploadConversations,
        loadMoreServerConversations,
        serverListStatus,
    } = useSyncedConversations({
        isSignedIn: !!clerkUser,
        // Guests have no server rows; skip the query entirely rather than
        // paginating over an empty set.
        fetchServerList: !!clerkUser,
        initialNumItems: 30,
    });

    // Single rename path: apply locally AND queue the server write once.
    const handleRenameConversation = useCallback((id: string, newTitle: string) => {
        updateConversation(id, { title: newTitle });
        syncMetadataMany([id], { title: newTitle });
    }, [updateConversation, syncMetadataMany]);

    // Bulk operations go through syncMetadataMany, which updates the local
    // cache optimistically *and* queues one server op per id. Previously these
    // only queued server writes, so the list never visibly changed.
    const handleArchiveMany = useCallback((ids: string[], isArchived: boolean) => {
        syncMetadataMany(ids, { isArchived });
    }, [syncMetadataMany]);

    const handlePinMany = useCallback((ids: string[], isPinned: boolean) => {
        syncMetadataMany(ids, { isPinned });
    }, [syncMetadataMany]);

    const handleDeleteMany = useCallback((ids: string[]) => {
        syncDeleteMany(ids);
    }, [syncDeleteMany]);

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
                // Persist once here. The screen shows the returned title but does
                // NOT re-apply it via onRename — that used to double-queue the
                // same metadata op.
                updateConversation(id, { title: result.title });
                syncMetadataMany([id], { title: result.title });
                return result.title;
            }
            return null;
        } catch (err) {
            console.error("Failed to suggest title:", err);
            return null;
        }
    }, [readConversations, clerkUser, suggestTitleAction, updateConversation, syncMetadataMany]);

    const handleDeleteOne = useCallback((id: string) => {
        syncDeleteMany([id]);
    }, [syncDeleteMany]);

    // Only continue into the most recent NON-archived session so the empty-state
    // CTA can never drop the user into an archived chat.
    const handleContinueLast = useCallback(() => {
        const last = [...conversations]
            .filter((c) => !c.isArchived)
            .sort((a, b) => b.lastActive - a.lastActive)[0];
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
            onPin={(id, isPinned) => syncMetadataMany([id], { isPinned })}
            onArchive={(id, isArchived) => syncMetadataMany([id], { isArchived })}
            onSuggestTitle={isLoaded && clerkUser ? handleSuggestTitle : undefined}
            onDeleteOne={handleDeleteOne}
            onDeleteMany={handleDeleteMany}
            onArchiveMany={handleArchiveMany}
            onPinMany={handlePinMany}
            onContinueLast={handleContinueLast}
            // Only sessions the user can actually resume should light up the
            // empty-state "Continue last session" CTA (archived ones are hidden
            // from the All tab).
            hasAnyConversation={conversations.some((c) => !c.isArchived)}
            onExportAll={handleExportAll}
            onImportSessions={handleImport}
            onLoadMore={loadMoreServerConversations}
            canLoadMore={serverListStatus === "CanLoadMore"}
        />
    );
}
