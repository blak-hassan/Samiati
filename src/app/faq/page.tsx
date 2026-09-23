import Link from 'next/link';
import SamiatiLogo from '@/components/SamiatiLogo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const faqs = [
  {
    question: 'Is Samiati free to use?',
    answer:
      'Yes! The Explorer plan is free forever with no credit card required.',
  },
  {
    question: 'Which languages are supported?',
    answer:
      'Samiati supports Swahili, Kikuyu, Luo, Kamba, Kalenjin, Luhya, Meru, Maasai, and English.',
  },
  {
    question: 'How does Changa work?',
    answer:
      'Changa is our community contribution system for preserving African languages.',
  },
];

export const metadata = {
  title: 'FAQ — Samiati',
  description: 'Frequently asked questions about Samiati.',
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <SamiatiLogo size={36} variant="primary" />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display">Frequently Asked Questions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to know about Samiati
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-border p-5 transition-colors"
            >
              <h2 className="text-lg font-semibold text-white">{faq.question}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}