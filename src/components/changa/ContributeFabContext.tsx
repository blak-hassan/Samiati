"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Lightweight context that lets descendant screens opt out of the
 * contribute FAB without prop-drilling. Wizard screens like
 * `DocumentUploadScreen` and `TaskContributionScreen` call `setFabHidden`
 * to suppress the FAB while they own the primary CTA. The default is
 * visible.
 */
interface ContributeFabContextValue {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

const ContributeFabContext = createContext<ContributeFabContextValue | null>(null);

export function ContributeFabProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const value = useMemo<ContributeFabContextValue>(
    () => ({
      hidden,
      setHidden: (next) => setHidden(next),
    }),
    [hidden]
  );
  return (
    <ContributeFabContext.Provider value={value}>
      {children}
    </ContributeFabContext.Provider>
  );
}

export function useContributeFab() {
  const ctx = useContext(ContributeFabContext);
  return ctx ?? { hidden: false, setHidden: () => {} };
}

/**
 * Convenience hook for screens that should suppress the FAB for their
 * lifetime. Restores the prior state on unmount.
 */
export function useHideContributeFab(active: boolean) {
  const { setHidden } = useContributeFab();
  // We intentionally call setHidden during render so the change is
  // applied before the FAB is observed by users. React tolerates this
  // pattern when the setter is stable.
  React.useEffect(() => {
    setHidden(active);
    return () => setHidden(false);
  }, [active, setHidden]);
}

export function useContributeFabSetters() {
  const { setHidden } = useContributeFab();
  return useCallback((hidden: boolean) => setHidden(hidden), [setHidden]);
}
