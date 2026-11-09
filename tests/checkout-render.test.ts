import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ plan: null as string | null }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(
    navigation.plan === null ? {} : { plan: navigation.plan }
  ),
}));
vi.mock('../src/components/CheckoutForm', () => ({
  CheckoutForm: ({ plan }: { plan: string }) => React.createElement('div', { 'data-plan': plan }),
}));

import CheckoutPage from '../src/app/checkout/page';

describe('checkout initial rendering', () => {
  it.each([
    [null, 'learner'],
    ['', 'learner'],
    ['organization', 'learner'],
    ['invalid', 'learner'],
    ['__proto__', 'learner'],
    ['toString', 'learner'],
    ['free', 'free'],
    ['learner', 'learner'],
    ['fluent', 'fluent'],
  ])('renders a supported plan for the URL value %s', (requested, expected) => {
    navigation.plan = requested;
    const markup = renderToStaticMarkup(React.createElement(CheckoutPage));
    expect(markup).toContain('Complete Your Purchase');
    expect(markup).toContain(`data-plan="${expected}"`);
  });
});
