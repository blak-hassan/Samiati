import { Suspense } from "react";

import { ChatScreen } from "@/components/chat/chat-screen";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading conversation…
        </div>
      }
    >
      <ChatScreenWithParams params={params} />
    </Suspense>
  );
}

async function ChatScreenWithParams({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatScreen conversationId={id} />;
}
