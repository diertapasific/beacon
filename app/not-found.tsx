import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-paper flex flex-col justify-center px-8 sm:px-20 pb-20">
      <p className="font-mono text-[clamp(5rem,20vw,14rem)] font-extrabold leading-none text-line select-none">
        404
      </p>

      <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
        Page not found
      </h1>
      <p className="mt-2 text-base text-ink-soft max-w-[42ch]">
        That URL doesn&apos;t match anything. It may have moved or never existed.
      </p>

      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center gap-2 self-start rounded-2xl bg-clay text-cream
          border-2 border-line px-5 py-3 text-sm font-bold shadow-hard press-clay"
      >
        <ArrowLeft size={16} weight="bold" />
        Back to dashboard
      </Link>
    </main>
  );
}
