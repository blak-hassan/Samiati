"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SettingsGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, description, children, className }) => {
  return (
    <section className={cn("space-y-2", className)}>
      {title && (
        <header className="px-1">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </header>
      )}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-sm">
        {children}
      </div>
    </section>
  );
};

export default SettingsGroup;
