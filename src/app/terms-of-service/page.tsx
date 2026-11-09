import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { termsOfService } from '@/components/legal/legal-content';

export const metadata: Metadata = {
  title: 'Terms of Service | Samiati',
  description:
    'The terms for using Samiati, including accounts, AI tools, community participation, Changa contributions, and subscriptions.',
};

export default function TermsOfServicePage() {
  return <LegalDocument document={termsOfService} />;
}
