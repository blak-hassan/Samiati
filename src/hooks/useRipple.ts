"use client";

import { useCallback, MouseEvent } from "react";

/**
 * Adds a material-design-style ripple effect to any clickable element.
 * Attach via onMouseDown={createRipple} on the container (needs position: relative + overflow: hidden).
 */
export function useRipple() {
  const createRipple = useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  return { createRipple };
}
