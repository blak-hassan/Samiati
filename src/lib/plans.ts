// src/lib/plans.ts
// Single source of truth for Samiati's pricing plans. Consumed by:
//  - the landing page pricing preview (src/app/page.tsx)
//  - the public pricing page (src/app/pricing/page.tsx)
// Keep `href` accurate: free/learner/fluent route to /checkout (handled by
// src/app/checkout/page.tsx); Organization is contact-sales via mailto.
//
// NOTE: checkout/page.tsx and src/components/SubscriptionManager.tsx keep
// their own plan shapes (display name + price + period) and are a separate
// follow-up to unify. See .kilo plans for the pricing-data DRY task.
export interface Plan {
  title: string;
  price: string;
  priceSuffix?: string;
  description: string;
  features: string[];
  cta: string;
  /** Where the CTA navigates. mailto: links must be opened via
   * window.location.assign, not Next router.push. */
  href: string;
  popular?: boolean;
}

export const PLANS: readonly Plan[] = [
  {
    title: 'Explorer',
    price: 'Free',
    priceSuffix: undefined,
    description: 'Perfect for getting started with African languages',
    features: [
      '10 AI messages per day',
      '5 translations per day',
      '2 voice messages per day',
      '7-day conversation history',
      '1 language profile',
    ],
    cta: 'Get Started Free',
    href: '/sign-up',
    popular: false,
  },
  {
    title: 'Learner',
    price: '$5',
    priceSuffix: 'month',
    description: 'For dedicated learners ready to level up',
    features: [
      '400 AI messages per month',
      '200 translations per month',
      '20 voice minutes per month',
      '90-day conversation history',
      '5 language profiles',
    ],
    cta: 'Start Learning',
    href: '/checkout?plan=learner',
    popular: true,
  },
  {
    title: 'Fluent',
    price: '$15',
    priceSuffix: 'month',
    description: 'For serious learners and language enthusiasts',
    features: [
      '1,500 AI messages per month',
      '750 translations per month',
      '80 voice minutes per month',
      'Unlimited conversation history',
      'Unlimited language profiles',
      'Conversation export',
      'Priority support',
    ],
    cta: 'Go Fluent',
    href: '/checkout?plan=fluent',
    popular: false,
  },
  {
    title: 'Organization',
    price: 'Custom',
    priceSuffix: undefined,
    description: 'For schools, NGOs, and language organizations',
    features: [
      'Custom usage limits',
      'API access',
      'Admin dashboard',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    href: 'mailto:support@samiati.com',
    popular: false,
  },
];

/** Plans shown on the landing page pricing preview (org is contact-sales only). */
export const LANDING_PLANS = PLANS.filter((p) => p.title !== 'Organization');

