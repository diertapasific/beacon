"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, SignOut, CaretRight } from "@phosphor-icons/react";
import { Logo } from "../ui/Logo";

export function Navbar({
  streak,
  level,
  pathName,
}: {
  streak: number;
  level: number;
  pathName?: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-canvas/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Logo href="/dashboard" />
          {pathName && (
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <CaretRight size={13} className="text-zinc-300 shrink-0" />
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors truncate max-w-[200px]"
              >
                All paths
              </Link>
              <CaretRight size={13} className="text-zinc-300 shrink-0" />
              <span className="text-sm font-semibold text-ink truncate max-w-[200px]">
                {pathName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700">
            <Flame size={18} weight="fill" className={streak > 0 ? "text-accent-500" : "text-zinc-300"} />
            <span className="font-mono tabular-nums">{streak}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700">
            <span className="grid place-items-center w-6 h-6 rounded-md bg-ink text-accent-400 text-[11px] font-bold font-mono">
              {level}
            </span>
            <span className="hidden sm:inline text-zinc-500">Level</span>
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-ink transition-colors active:scale-95"
          >
            <SignOut size={18} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
