"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Swipe-to-review deck.
// Prototype: "Swipe right if correct, left if it needs fixing, or use the
// buttons." Right = correct (accept), left = needs fixing (minor_fix).
//
// Keyboard/touch-parity: the buttons rendered by the caller remain the
// canonical control; this only adds the gesture on top and announces the
// mapping for screen readers.
// ---------------------------------------------------------------------------

const SWIPE_THRESHOLD = 80;

export function SwipeVoteDeck({
  children,
  onSwipeRight,
  onSwipeLeft,
  disabled = false,
}: {
  children: ReactNode;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  disabled?: boolean;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const begin = (clientX: number) => {
    if (disabled) return;
    setDragging(true);
    startX.current = clientX;
  };

  const move = (clientX: number) => {
    if (!dragging || disabled) return;
    setDx(clientX - startX.current);
  };

  const end = () => {
    if (!dragging) return;
    setDragging(false);
    if (dx > SWIPE_THRESHOLD) onSwipeRight();
    else if (dx < -SWIPE_THRESHOLD) onSwipeLeft();
    setDx(0);
  };

  const rotation = Math.max(-6, Math.min(6, dx / 20));
  const tone = dx > SWIPE_THRESHOLD ? "border-emerald-400" : dx < -SWIPE_THRESHOLD ? "border-sky-400" : "border-border/60";

  return (
    <div
      className="select-none"
      style={{ touchAction: "pan-y" }}
      onPointerDown={(event) => begin(event.clientX)}
      onPointerMove={(event) => move(event.clientX)}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none -mb-2 flex justify-between px-1 text-xs font-bold uppercase tracking-wider transition-opacity",
          dx < -20 ? "text-sky-600 dark:text-sky-300 opacity-100" : "opacity-0",
        )}
      >
        <span>Needs fixing</span>
        <span className="invisible">Correct</span>
      </div>
      <div
        className={cn("rounded-2xl border-2 bg-card transition-transform", tone)}
        style={{
          transform: `translateX(${dx}px) rotate(${rotation}deg)`,
          transition: dragging ? "none" : "transform 200ms ease",
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none -mt-2 flex justify-between px-1 text-xs font-bold uppercase tracking-wider transition-opacity",
          dx > 20 ? "text-emerald-600 dark:text-emerald-300 opacity-100" : "opacity-0",
        )}
      >
        <span className="invisible">Needs fixing</span>
        <span>Correct</span>
      </div>
    </div>
  );
}
