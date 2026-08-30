"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Props {
  title: string;
  onBack: () => void;
  children?: React.ReactNode;
}

const SettingsPageHeader: React.FC<Props> = ({ title, onBack, children }) => {
  return (
    <header className="flex items-center px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
      <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full" aria-label="Go back">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1 className="text-lg font-bold text-foreground ml-2 tracking-tight">{title}</h1>
      {children && <div className="ml-auto">{children}</div>}
    </header>
  );
};

export default SettingsPageHeader;
