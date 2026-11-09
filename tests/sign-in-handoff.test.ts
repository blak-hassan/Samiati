import { describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ push: vi.fn(), prefetch: vi.fn(), back: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import { useNavigation } from '../src/hooks/useNavigation';
import { Screen } from '../src/types';

describe('guest question sign-in handoff', () => {
  it('preserves the question and return route in the sign-in URL', () => {
    const question = 'Explain water & farming?';
    const returnTo = `/dashboard?q=${encodeURIComponent(question)}`;
    useNavigation().navigate(Screen.SIGN_IN, { redirect_url: returnTo });
    const destination = router.push.mock.lastCall![0] as string;
    const signIn = new URL(destination, 'https://example.test');
    expect(signIn.pathname).toBe('/sign-in');
    const redirect = signIn.searchParams.get('redirect_url');
    expect(redirect).toBe(returnTo);
    expect(new URL(redirect!, 'https://example.test').searchParams.get('q')).toBe(question);
    expect(router.prefetch).toHaveBeenLastCalledWith(destination);
  });
});
