import type { ReactNode } from 'react';

export interface PageIntroProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

export function PageIntro({ eyebrow, title, description, children }: PageIntroProps) {
  return (
    <header className="space-y-5 py-8 sm:py-12">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      )}
      <h1 className="max-w-4xl font-editorial text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.03] tracking-[-0.035em] [overflow-wrap:anywhere]">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
