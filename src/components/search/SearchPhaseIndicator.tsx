'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchPhaseIndicatorProps {
  isSearching: boolean;
  className?: string;
}

const SearchPhaseIndicator: React.FC<SearchPhaseIndicatorProps> = ({ isSearching, className }) => {
  if (!isSearching) return null;

  return (
    <div role="status" aria-live="polite" className={cn('flex items-center gap-2 py-3', className)}>
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Samiati is working on your answer…</span>
    </div>
  );
};

export default SearchPhaseIndicator;
