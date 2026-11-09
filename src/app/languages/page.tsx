import type { Metadata } from 'next';
import { LanguageExplorer } from '@/components/public/LanguageExplorer';

export const metadata: Metadata = {
  title: 'Languages · Samiati',
  description:
    'Explore Samiati’s language routes, choose a default, and help shape future language support.',
};

export default function LanguagesPage() {
  return <LanguageExplorer />;
}
