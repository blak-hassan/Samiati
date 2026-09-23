import { Conversation } from "@/types";

function triggerDownload(blob: Blob, filename: string): void {
    if (typeof window === "undefined") return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeFilename(s: string): string {
    return s.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "session";
}

export function exportConversationAsJSON(conversation: Conversation): void {
    const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: "application/json" });
    triggerDownload(blob, `samiati-${safeFilename(conversation.title)}.json`);
}

export function exportConversationAsMarkdown(conversation: Conversation): void {
    const lines: string[] = [];
    lines.push(`# ${conversation.title}`);
    lines.push("");
    if (conversation.language) lines.push(`**Language:** ${conversation.language}`);
    if (conversation.category) lines.push(`**Category:** ${conversation.category}`);
    lines.push(`**Saved:** ${conversation.date}`);
    lines.push(`**Messages:** ${conversation.messageCount}`);
    lines.push("");
    lines.push("---");
    lines.push("");
    for (const msg of conversation.messages) {
        const speaker = msg.sender === "user" ? "You" : msg.sender === "ai" ? "Kaanze" : msg.sender;
        lines.push(`**${speaker}:** ${msg.text}`);
        if (msg.translatedText) lines.push(`  *(translation: ${msg.translatedText})*`);
        lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    triggerDownload(blob, `samiati-${safeFilename(conversation.title)}.md`);
}

export function exportAllConversations(conversations: Conversation[]): void {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: "application/json" });
    triggerDownload(blob, `samiati-sessions-${new Date().toISOString().slice(0, 10)}.json`);
}
