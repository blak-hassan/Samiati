"use client";

import { useCallback } from "react";

/**
 * Hook for smooth page transitions using the View Transitions API.
 * Falls back to a simple callback if the API isn't supported.
 */
export function usePageTransition() {
  const transitionTo = useCallback((callback: () => void) => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        callback();
      });
    } else {
      callback();
    }
  }, []);

  return { transitionTo };
}
