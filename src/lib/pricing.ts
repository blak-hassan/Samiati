/** Public planning data only. These are not billing tiers or entitlements. */
export interface ProposedPlan {
  id: 'free' | 'learner' | 'fluent' | 'organization';
  name: string;
  price: string;
  interval?: string;
  description: string;
  intentions: readonly string[];
  href: string;
  cta: string;
  highlighted?: boolean;
}

export const PRICING_STATUS = 'proposal' as const;

export const PROPOSED_PLANS: readonly ProposedPlan[] = [
  {
    id: 'free',
    name: 'Explorer',
    price: 'Free',
    description: 'A welcoming place to begin with AI in your language.',
    intentions: [
      'Explore the conversational experience',
      'Discover available languages',
      'Guest access where available',
    ],
    href: '/dashboard',
    cta: 'Start exploring',
  },
  {
    id: 'learner',
    name: 'Learner',
    price: '$5',
    interval: 'month',
    description: 'A proposed plan for everyday curiosity and personal projects.',
    intentions: [
      'Designed for regular conversations',
      'For learning, writing, and creating',
      'Included usage to be confirmed',
    ],
    href: '/#waitlist',
    cta: 'Get launch updates',
    highlighted: true,
  },
  {
    id: 'fluent',
    name: 'Fluent',
    price: '$15',
    interval: 'month',
    description: 'A proposed plan for people who make language part of their work.',
    intentions: [
      'Designed for more frequent use',
      'For ongoing language projects',
      'Included usage to be confirmed',
    ],
    href: '/#waitlist',
    cta: 'Get launch updates',
  },
  {
    id: 'organization',
    name: 'Organization',
    price: 'Custom',
    description: 'A conversation about the needs of your team or community.',
    intentions: [
      'Schools and language organizations',
      'Community and research projects',
      'Scope and pricing agreed together',
    ],
    href: 'mailto:hasb8882@gmail.com?subject=Samiati%20organization%20enquiry',
    cta: 'Get in touch',
  },
];
