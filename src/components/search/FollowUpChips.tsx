'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowUpChipsProps {
  suggestions: string[];
  onSelect: (query: string) => void;
}

const FollowUpChips: React.FC<FollowUpChipsProps> = ({ suggestions, onSelect }) => {
  if (!suggestions.length) return null;

  return (
    <div className="w-full">
      <p className="mb-2.5 text-xs font-semibold text-muted-foreground">Explore another question</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, i) => (
          <Button
            key={i}
            variant="ghost"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className={cn(
              'h-auto min-h-11 max-w-full whitespace-normal py-2 px-3.5 rounded-xl text-xs font-medium',
              'bg-card border border-border text-muted-foreground',
              'hover:bg-secondary hover:text-foreground',
              'transition-colors duration-200',
              'gap-2 group'
            )}
          >
            <span className="text-left leading-snug">{suggestion}</span>
            <ArrowRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        ))}
      </div>
    </div>
  );
};

export default FollowUpChips;
