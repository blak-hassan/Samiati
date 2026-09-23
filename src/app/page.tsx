import { cn } from '@/lib/utils';
import { LANDING_PLANS } from '@/lib/plans';
import Link from 'next/link';
import SamiatiLogo from '@/components/SamiatiLogo';
import Navbar from '@/components/landing/Navbar';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { TestimonialCard } from '@/components/landing/TestimonialCard';
import FAQAccordion from '@/components/landing/FAQAccordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CookieSettingsLink } from '@/components/cookie-consent';
import { HeroCta } from '@/components/landing/HeroCta';
import { WaitlistForm } from '@/components/WaitlistForm';
import {
  MessageSquare,
  Mic,
  BookOpen,
  Users,
  Globe2,
  Zap,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'AI-Powered Chat',
    description:
      'Practice conversations in African languages with an AI tutor that understands cultural context and nuance.',
  },
  {
    icon: <Mic className="h-6 w-6" />,
    title: 'Voice Messages',
    description:
      'Record and listen to voice messages to perfect your pronunciation and connect with native speakers.',
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: 'Cultural Stories',
    description:
      'Explore proverbs, folktales, and oral histories passed down through generations across the continent.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Community Challenges',
    description:
      'Join Changa challenges to contribute words, validate entries, and earn recognition from the community.',
  },
  {
    icon: <Globe2 className="h-6 w-6" />,
    title: 'Language Profiles',
    description:
      'Build profiles for multiple languages and dialects, track your progress, and set personal goals.',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Instant Translation',
    description:
      'Get fast, context-aware translations between African languages and major world languages.',
  },
];

const testimonials = [
  {
    quote:
      "Samiati helped me reconnect with my grandmother's language. I never thought I'd be fluent in Swahili again.",
    name: 'Amara O.',
    role: 'Language Learner',
  },
  {
    quote:
      'The Changa challenges make contributing to language preservation feel like a game. My kids and I do them together.',
    name: 'Kwame M.',
    role: 'Community Contributor',
  },
  {
    quote: 'Finally, an app that treats African languages with the depth and respect they deserve.',
    name: 'Fatima N.',
    role: 'Educator',
  },
];

const faqs = [
  {
    question: 'Is Samiati free to use?',
    answer:
      'Yes! The Explorer plan is free forever with no credit card required. You get 10 AI messages per day, 5 translations per day, and 2 voice messages per day. Paid plans unlock higher limits and additional features.',
  },
  {
    question: 'Which languages are supported?',
    answer:
      'Samiati currently supports Swahili, Kikuyu, Luo, Kamba, Kalenjin, Luhya, Meru, Maasai, and English. We prioritise Kenyan languages in this release and are expanding based on community demand — if there is a language you want to see, let us know — we are building the roadmap with community input.',
  },
  {
    question: 'How does the Changa contribution system work?',
    answer:
      'Changa is our community-driven contribution platform. Users can submit new words, validate existing entries, and participate in challenges. Contributions earn XP and help improve the platform for everyone.',
  },
  {
    question: 'Can I use Samiati offline?',
    answer:
      'Some features work offline — you can review your saved conversations and any content you have downloaded locally. AI chat and real-time translation need an internet connection.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. We take privacy seriously. Your personal data is encrypted, and we never sell your information to third parties. You can delete your account and all associated data at any time.',
  },
];

export default function Home() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="min-h-screen bg-background text-foreground antialiased"
    >
      <Navbar />

      {/* Hero */}
      <section id="home-hero" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-40 -left-40 h-96 w-96 rounded-full bg-rasta-red/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center space-y-8">
            <SamiatiLogo size={80} variant="primary" className="mx-auto" />
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-display">
              Preserve. Share. Celebrate.
              <span className="block text-gold">African Languages.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Explore, learn, and contribute to African language preservation with AI-powered chat,
              voice messages, and community challenges.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <HeroCta />
              <Button variant="outline" size="lg" asChild>
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground sm:text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold" />
                Free forever plan
              </span>
            </div>

            {/* Waitlist signup — live counter updates in real time. */}
            <WaitlistForm
              source="hero"
              title="Join the waitlist"
              description="Get early access and launch announcements."
            />
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {[
              { value: '10,000+', label: 'Words Preserved' },
              { value: '50+', label: 'Languages' },
              { value: '100,000+', label: 'Contributions' },
              { value: '30+', label: 'African Countries' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-gold sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="border-gold/50 text-gold">
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
              Everything you need to connect with your heritage
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              From AI-powered conversations to community-driven challenges, Samiati gives you the
              tools to learn, preserve, and share African languages.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="border-gold/50 text-gold">
              How It Works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
              Start preserving languages in minutes
            </h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Create Your Account',
                description:
                  'Sign up for free and choose the African languages you want to explore and preserve.',
              },
              {
                step: '2',
                title: 'Choose Your Path',
                description:
                  'Chat with AI, record voice messages, read cultural stories, or join community challenges.',
              },
              {
                step: '3',
                title: 'Make an Impact',
                description:
                  "Contribute words, validate entries, and help build the world's most comprehensive African language platform.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-gold">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="border-gold/50 text-gold">
              Pricing
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Choose the plan that fits your language learning journey. Start free and upgrade when
              you are ready.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {LANDING_PLANS.map((plan) => (
              <div
                key={plan.title}
                className={cn(
                  'rounded-2xl border bg-card p-6 flex flex-col',
                  plan.popular && 'border-gold shadow-lg'
                )}
              >
                {plan.popular && (
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{plan.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.priceSuffix && (
                      <span className="text-sm text-muted-foreground">/{plan.priceSuffix}</span>
                    )}
                  </div>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="border-gold/50 text-gold">
              Testimonials
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
              Loved by language enthusiasts
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item) => (
              <TestimonialCard
                key={item.name}
                quote={item.quote}
                name={item.name}
                role={item.role}
              />
            ))}
          </div>
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="border-gold/50 text-gold">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-12">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
              Ready to explore your culture?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of learners preserving African languages, one word at a time.
            </p>
            <div className="mt-8">
              <HeroCta location="final-cta" label="Get Started Free" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <SamiatiLogo size={32} variant="primary" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/languages" className="hover:text-foreground transition-colors">
                Languages
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <CookieSettingsLink className="hover:text-foreground transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Samiati. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
