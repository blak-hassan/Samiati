'use client';

import LegalDocument from '@/components/legal/LegalDocument';
import { termsOfService } from '@/components/legal/legal-content';

interface Props {
  goBack: () => void;
}

export default function TermsOfServiceScreen({ goBack }: Props) {
  return <LegalDocument document={termsOfService} goBack={goBack} />;
}
