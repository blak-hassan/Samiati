import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  buildSavedConversation,
  getSavedLanguageCode,
  isServiceError,
} from '../src/components/chat/history';
import { localConversationService } from '../src/services/localConversationService';
import type { Message } from '../src/types';

const now = Date.UTC(2026, 10, 8, 12);
const firstTurn: Message[] = [
  { id: 'q1', sender: 'user', text: 'A question in my language', timestamp: new Date(now) },
  { id: 'a1', sender: 'ai', text: 'An answer', timestamp: new Date(now) },
];

beforeEach(() => {
  const records = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('window', { localStorage });
});

describe('chat history migration', () => {
  it('preserves the selected conversation id, pinned status, title and turn order when continuing', () => {
    const original = {
      ...buildSavedConversation(firstTurn, undefined, now, { code: 'ki', name: 'Kikuyu' }),
      isPinned: true,
      title: 'A title I chose',
    };
    const nextTurn: Message[] = [
      ...firstTurn,
      { id: 'q2', sender: 'user', text: 'A second question', timestamp: new Date(now + 1000) },
      { id: 'a2', sender: 'ai', text: 'A second answer', timestamp: new Date(now + 1000) },
    ];
    const continued = buildSavedConversation(nextTurn, original, now + 1000, {
      code: 'luo',
      name: 'Dholuo',
    });
    expect(continued.id).toBe(original.id);
    expect(continued.isPinned).toBe(true);
    expect(continued.title).toBe('A title I chose');
    expect(continued.messages.map((message) => message.id)).toEqual(['q1', 'a1', 'q2', 'a2']);
    expect(continued.messageCount).toBe(4);
    expect(continued.languageCode).toBe('luo');
  });

  it('reopens a selected thread using the existing storage keys without overwriting another thread', () => {
    const first = buildSavedConversation(firstTurn, undefined, now, { code: 'ki', name: 'Kikuyu' });
    const second = buildSavedConversation(firstTurn, undefined, now + 1000, {
      code: 'sw',
      name: 'Kiswahili',
    });
    localConversationService.saveConversation(first);
    localConversationService.saveConversation(second);
    localConversationService.setActiveConversationId(first.id);
    const reopened = localConversationService.getConversation(
      localConversationService.getActiveConversationId()!
    );
    expect(reopened?.id).toBe(first.id);
    expect(getSavedLanguageCode(reopened)).toBe('ki');
    const continued = buildSavedConversation(
      [...reopened!.messages, { ...firstTurn[0], id: 'q2' }],
      reopened,
      now + 2000
    );
    localConversationService.saveConversation(continued);
    expect(localConversationService.getConversations()).toHaveLength(2);
    expect(localConversationService.getConversation(second.id)?.messages).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem('samiati_conversations')!)).toHaveLength(2);
    expect(localStorage.getItem('samiati_active_chat')).toBe(first.id);
  });

  it('recovers language names saved before the redesign and prefers an explicit code', () => {
    const original = buildSavedConversation(firstTurn, undefined, now);
    expect(getSavedLanguageCode({ ...original, language: 'Swahili' })).toBe('sw');
    expect(getSavedLanguageCode({ ...original, language: 'Luo' })).toBe('luo');
    expect(getSavedLanguageCode({ ...original, language: 'Dholuo' })).toBe('luo');
    expect(getSavedLanguageCode({ ...original, language: 'Swahili', languageCode: 'ki' })).toBe(
      'ki'
    );
    expect(getSavedLanguageCode(original)).toBeUndefined();
  });
});

describe('service error responses', () => {
  it.each([
    'ERROR: API key not configured',
    ' API error: 503',
    'Rate limit exceeded. Please wait.',
    'Model is loading, please try again.',
  ])('does not treat %s as an assistant answer', (answer) => {
    expect(isServiceError(answer)).toBe(true);
  });
  it('does not reject a genuine answer discussing an error', () => {
    expect(isServiceError('An error can mean several things. Here is how to solve it.')).toBe(
      false
    );
  });
});
