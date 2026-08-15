"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1c1917] p-8 text-center shadow-2xl">
        <h1 className="mb-2 text-2xl font-black text-stone-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
          An unexpected error happened while loading this page
          {error?.digest ? ` (${error.digest})` : ""}. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}