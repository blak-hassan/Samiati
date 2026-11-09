import type { ReactNode } from 'react';
import { ProductNav } from '@/components/product/ProductNav';

/** Contribution pages retain their own tasks while sharing Samiati navigation. */
export function ChangaShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background pb-24 md:pb-8">
      <ProductNav active="changa" />
      <main
        id="main-content"
        tabIndex={-1}
        className="px-4 py-8 sm:px-6 sm:py-12 [&_button[data-slot=button]]:min-h-11"
      >
        {children}
      </main>
    </div>
  );
}
