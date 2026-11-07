"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Replace with your error reporting service when one is configured.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Samiati hit an unexpected error
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your conversations are safe. Try again, and if it keeps happening,
        clearing your local data from Settings will reset the app.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
