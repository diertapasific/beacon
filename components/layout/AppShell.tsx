"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Lighthouse, SquaresFour, BookOpen, Flame, SignOut } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  streak: number;
  level: number;
  pathName?: string;
  pathId?: string;
  nextLessonId?: string | null;
}

export function AppShell({ children, streak, level, pathName, pathId, nextLessonId }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const pathDashHref = pathId ? `/dashboard/${pathId}` : "/dashboard";
  const learnHref = nextLessonId ? `/lesson/${nextLessonId}` : pathDashHref;
  const onPaths = pathname === "/dashboard";
  const onLearn = pathname.startsWith("/lesson") || pathname.startsWith("/dashboard/");

  return (
    <div className="bg-paper min-h-[100dvh]">
      {/* Desktop left icon-rail */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-[68px] flex-col items-center justify-between border-r-2 border-line bg-cream py-5">
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/dashboard"
            aria-label="Beacon"
            className="grid place-items-center w-10 h-10 rounded-lg bg-clay text-cream border-2 border-line shadow-hard-sm mb-2
              transition-transform hover:-translate-y-0.5 hover:rotate-[-6deg]"
          >
            <Lighthouse size={20} weight="fill" />
          </Link>
          <RailLink href="/dashboard" label="Paths" active={onPaths} icon={SquaresFour} />
          <RailLink href={learnHref} label="Learn" active={onLearn} icon={BookOpen} />
        </div>

        <div className="flex flex-col items-center gap-4">
          <RailStat label={`${streak} day streak`}>
            <div className="flex flex-col items-center gap-1">
              <Flame size={18} weight="fill" className={streak > 0 ? "text-streak" : "text-ink-faint"} />
              <span className="font-mono text-[11px] font-bold tabular-nums text-ink-soft">{streak}</span>
            </div>
          </RailStat>
          <RailStat label={`Level ${level}`}>
            <div className="grid place-items-center w-9 h-9 rounded-lg border-2 border-line bg-sun-tint font-mono text-xs font-bold text-ink">
              {level}
            </div>
          </RailStat>
          <RailStat label="Sign out">
            <button
              onClick={logout}
              aria-label="Sign out"
              className="grid place-items-center w-9 h-9 rounded-lg border-2 border-transparent text-ink-soft hover:text-ink hover:bg-paper-2 transition-colors active:scale-95"
            >
              <SignOut size={18} />
            </button>
          </RailStat>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b-2 border-line bg-paper/90 backdrop-blur-md px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-clay text-cream border-2 border-line shrink-0">
            <Lighthouse size={16} weight="fill" />
          </span>
          {pathName ? (
            <span className="text-sm font-bold text-ink truncate">{pathName}</span>
          ) : (
            <span className="text-sm font-bold text-ink">Beacon</span>
          )}
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
            <Flame size={16} weight="fill" className={streak > 0 ? "text-streak" : "text-ink-faint"} />
            <span className="font-mono font-bold tabular-nums text-xs">{streak}</span>
          </span>
          <button onClick={logout} aria-label="Sign out" className="text-ink-soft hover:text-ink active:scale-95">
            <SignOut size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="md:pl-[68px] pb-24 md:pb-0">{children}</div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-2 border-t-2 border-line bg-cream">
        <BottomTab href="/dashboard" label="Paths" active={onPaths} icon={SquaresFour} />
        <BottomTab href={learnHref} label="Learn" active={onLearn} icon={BookOpen} />
      </nav>
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="
      pointer-events-none absolute left-full ml-3 z-50
      px-2.5 py-1 rounded-lg bg-cream border-2 border-line shadow-hard-sm
      font-bold text-xs text-ink whitespace-nowrap
      opacity-0 -translate-x-1
      group-hover:opacity-100 group-hover:translate-x-0
      transition-all duration-150
    ">
      {children}
    </span>
  );
}

function RailLink({
  href, label, active, icon: Icon,
}: { href: string; label: string; active: boolean; icon: React.ElementType }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`group relative grid place-items-center w-10 h-10 rounded-lg border-2 transition-all active:scale-95 ${
        active
          ? "bg-clay text-cream border-line shadow-hard-sm"
          : "border-transparent text-ink-soft hover:bg-paper-2 hover:text-ink"
      }`}
    >
      <Icon size={20} weight={active ? "fill" : "regular"} />
      <RailLabel>{label}</RailLabel>
    </Link>
  );
}

function RailStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex items-center justify-center">
      {children}
      <RailLabel>{label}</RailLabel>
    </div>
  );
}

function BottomTab({
  href, label, active, icon: Icon,
}: { href: string; label: string; active: boolean; icon: React.ElementType }) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition-colors active:scale-95 ${
        active ? "text-clay-deep" : "text-ink-faint"
      }`}
    >
      {active && <span className="absolute top-0 inset-x-6 h-1 bg-clay rounded-b" />}
      <Icon size={21} weight={active ? "fill" : "regular"} />
      {label}
    </Link>
  );
}
