'use client';

import LegalDocument from '@/components/legal/LegalDocument';
import { privacyPolicy } from '@/components/legal/legal-content';

interface Props {
  goBack: () => void;
}

export default function PrivacyPolicyScreen({ goBack }: Props) {
  return <LegalDocument document={privacyPolicy} goBack={goBack} />;
}
