import Link from 'next/link';

export default function LegalLinks() {
  return (
    <nav
      aria-label="Legal information"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-stone-600 dark:text-stone-400"
    >
      <Link
        href="/privacy-policy"
        className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Privacy Policy
      </Link>
      <Link
        href="/terms-of-service"
        className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Terms of Service
      </Link>
    </nav>
  );
}
