import type { ReactNode } from 'react';

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

export type LegalDocumentData = {
  kind: 'privacy' | 'terms';
  title: string;
  description: string;
  updatedAt: string;
  effectiveDate: string;
  highlights: { title: string; description: string }[];
  sections: LegalSection[];
};
