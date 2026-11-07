import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        We could not find that page
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The link may be out of date, or the conversation may have been deleted.
      </p>
      <Button asChild>
        <Link href="/">Start a new chat</Link>
      </Button>
    </div>
  );
}
