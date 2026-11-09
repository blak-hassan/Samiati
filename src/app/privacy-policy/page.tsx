import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { privacyPolicy } from '@/components/legal/legal-content';

export const metadata: Metadata = {
  title: 'Privacy Policy | Samiati',
  description:
    'How Samiati collects, uses, shares, and protects information across its language tools, community, and Changa contributions.',
};

export default function PrivacyPolicyPage() {
  return <LegalDocument document={privacyPolicy} />;
}
