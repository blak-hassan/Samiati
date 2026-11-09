import type { Conversation, Message } from '../../types';

/** Signing in restores a draft; only an explicit Send carries send intent. */
export function chatSignInReturnUrl(question: string, send = false): string {
  const text = question.trim();
  return text
    ? `/dashboard?${new URLSearchParams({ [send ? 'q' : 'draft']: text })}`
    : '/dashboard';
}

/** Read old name-only records as well as current language-code records. */
export function getSavedLanguageCode(conversation?: Conversation | null): string | undefined {
  if (conversation?.languageCode) return conversation.languageCode;
  const name = conversation?.language?.toLowerCase();
  const aliases: Record<string, string> = {
    swahili: 'sw',
    kiswahili: 'sw',
    kikuyu: 'ki',
    luo: 'luo',
    dholuo: 'luo',
    kamba: 'kam',
    luhya: 'luy',
    kalenjin: 'kln',
    meru: 'mer',
    maasai: 'mas',
    english: 'en',
  };
  return name ? aliases[name] : undefined;
}

/** Backend actions currently return error strings, rather than throwing. */
export function isServiceError(answer: string): boolean {
  return /^(ERROR:|API error:|Model is loading|Rate limit exceeded|Translation Model is loading)/i.test(
    answer.trim()
  );
}

/** Preserve pinned state and metadata while recording the latest turn. */
export function buildSavedConversation(
  messages: Message[],
  existing: Conversation | undefined,
  now: number,
  language?: { code: string; name: string }
): Conversation {
  const firstQuestion = messages.find((message) => message.sender === 'user');
  return {
    ...(existing ?? {
      id: `chat_${now}`,
      title: firstQuestion?.text.slice(0, 60) || 'New conversation',
      date: new Date(now).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      isPinned: false,
      category: 'general' as const,
    }),
    messages,
    messageCount: messages.length,
    lastActive: now,
    ...(language ? { language: language.name, languageCode: language.code } : {}),
  };
}
