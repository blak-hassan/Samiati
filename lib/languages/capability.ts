import type { CapabilityLevel } from "./types";

export interface CapabilityDescriptor {
  label: string;
  description: string;
  /** Tailwind classes for the indicator dot. */
  dotClass: string;
  badgeClass: string;
}

const DESCRIPTORS: Record<CapabilityLevel, CapabilityDescriptor> = {
  full: {
    label: "Full",
    description: "Mature coverage — expect reliable results.",
    dotClass: "bg-emerald-500",
    badgeClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  beta: {
    label: "Beta",
    description: "Usable, and improving every release.",
    dotClass: "bg-amber-500",
    badgeClass:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  limited: {
    label: "Limited",
    description: "Partial coverage — some phrases may be awkward.",
    dotClass: "bg-orange-500/70",
    badgeClass:
      "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
  planned: {
    label: "Planned",
    description: "Not available yet.",
    dotClass: "bg-muted-foreground/50",
    badgeClass:
      "border-border bg-muted text-muted-foreground",
  },
  none: {
    label: "Unavailable",
    description: "Not supported.",
    dotClass: "bg-destructive/60",
    badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

/** Describes a capability level for display in the language selector. */
export function describeCapability(level: CapabilityLevel): CapabilityDescriptor {
  return DESCRIPTORS[level];
}

/** Short label for a capability level, e.g. "Full", "Beta", "Limited". */
export function capabilityLabel(level: CapabilityLevel): string {
  return DESCRIPTORS[level].label;
}
