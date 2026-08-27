"use client";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark px-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white font-display">
          Darasa
        </h1>

        <div className="space-y-3">
          <p className="text-lg font-medium text-stone-700 dark:text-stone-300">
            Coming Soon
          </p>
          <div className="flex items-center justify-center gap-4 text-sm font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span className="px-3 py-1 rounded-full border border-stone-300 dark:border-stone-600">
              Part One
            </span>
            <span className="px-3 py-1 rounded-full border border-stone-300 dark:border-stone-600">
              Part Two
            </span>
          </div>
        </div>

        <p className="text-sm text-stone-400 dark:text-stone-500">
          Stay tuned.
        </p>
      </div>
    </main>
  );
}
