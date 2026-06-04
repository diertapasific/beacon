"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowClockwise } from "@phosphor-icons/react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] bg-paper flex flex-col justify-center px-8 sm:px-20 pb-20">
      <p className="font-mono text-[clamp(5rem,20vw,14rem)] font-extrabold leading-none text-line select-none">
        500
      </p>

      <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 text-base text-ink-soft max-w-[42ch]">
        An unexpected error occurred. Try again — if it keeps happening, come back later.
      </p>

      {error.digest && (
        <p className="mt-3 font-mono text-xs text-ink-faint">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-2xl bg-clay text-cream
            border-2 border-line px-5 py-3 text-sm font-bold shadow-hard press-clay"
        >
          <ArrowClockwise size={16} weight="bold" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl bg-cream text-ink
            border-2 border-line px-5 py-3 text-sm font-bold shadow-hard press"
        >
          <ArrowLeft size={16} weight="bold" />
          Dashboard
        </Link>
      </div>
    </main>
  );
}
