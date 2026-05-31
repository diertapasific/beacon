"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Lock, Clock, CaretLeft, CaretDown,
  BookOpen, Lightbulb, Code, Scales, Sparkle, Repeat, Flame,
} from "@phosphor-icons/react";
import type { DashboardData, LessonSummary } from "@/lib/queries";
import { Mascot } from "../ui/Mascot";
import { toTitleCase } from "@/lib/format";
import { lessonTypeLabel } from "../ui/LessonTypeBadge";
import { Icon } from "../ui/Icon";
import { ACHIEVEMENTS } from "@/lib/achievements";

const NODE_ICON: Record<string, React.ElementType> = {
  concept_card:    BookOpen,
  analogy:         Lightbulb,
  code_snippet:    Code,
  myth_vs_reality: Scales,
  did_you_know:    Sparkle,
  flashcard:       Repeat,
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 110, damping: 20 } },
};

export function Dashboard({ data }: { data: DashboardData }) {
  const firstName = data.name?.split(" ")[0];
  const weeks = groupByWeek(data.lessons);
  const nextLesson = data.lessons.find((l) => l.id === data.nextLessonId);
  const pct = data.totalLessons ? Math.round((data.totalCompleted / data.totalLessons) * 100) : 0;

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-20"
    >
      {/* Header */}
      <motion.div variants={item}>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-ink-soft hover:text-clay-deep transition-colors mb-5"
        >
          <CaretLeft size={11} weight="bold" />
          All paths
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep">
              {greeting()}{firstName ? `, ${firstName}` : ""}
            </p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-none">
              {toTitleCase(data.path.skill)}
            </h1>
          </div>
          <Mascot
            state={data.streak.current > 0 ? "streak" : "idle"}
            size={88}
            className="shrink-0 hidden sm:block"
          />
        </div>
      </motion.div>

      {/* Stat strip — bordered cells, riso tints */}
      <motion.div variants={item} className="mt-8 rounded-xl border-2 border-line overflow-hidden shadow-hard">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x-2 divide-y-2 sm:divide-y-0 divide-line">
          <Metric label="Streak" value={`${data.streak.current}`} unit="days" tint="bg-sun-tint"
            icon={<Flame size={13} weight="fill" className={data.streak.current > 0 ? "text-streak" : "text-ink-faint"} />} />
          <Metric label="Level" value={`${data.xp.level}`} tint="bg-teal-tint" />
          <Metric label="Total XP" value={data.xp.total.toLocaleString()} tint="bg-clay-tint" />
          <Metric label="Progress" value={`${data.totalCompleted}/${data.totalLessons}`} tint="bg-cream" />
        </div>
      </motion.div>

      {/* XP progress line */}
      <motion.div variants={item} className="mt-4 flex items-center gap-3">
        <div className="h-3 flex-1 rounded-full bg-cream border-2 border-line overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.xp.progressPct}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-clay"
          />
        </div>
        <span className="font-mono text-[11px] font-bold text-ink-soft tabular-nums shrink-0">
          {data.xp.toNext > 0 ? `${data.xp.toNext.toLocaleString()} XP → L${data.xp.level + 1}` : "Max level"}
        </span>
      </motion.div>

      {/* Next up / completion hero */}
      <motion.div variants={item} className="mt-8">
        {data.allDone || !nextLesson ? (
          <AllDoneBlock skill={data.path.skill} completed={data.totalCompleted} />
        ) : (
          <NextUpBlock lesson={nextLesson} completedToday={data.completedToday} bonusActive={data.bonusXpActive} />
        )}
      </motion.div>

      {/* The path */}
      <motion.section variants={item} className="mt-12">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">/ Curriculum</h2>
          <span className="font-mono text-[11px] font-bold text-ink-faint tabular-nums">{pct}% complete</span>
        </div>
        <PathRoute weeks={weeks} nextLessonId={data.nextLessonId} weekThemes={data.weekThemes} />
      </motion.section>

      {/* Achievements */}
      <motion.section variants={item} className="mt-12">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft mb-4">/ Badges</h2>
        <AchievementShelf earned={data.achievements} />
      </motion.section>
    </motion.main>
  );
}

function Metric({ label, value, unit, icon, tint }: { label: string; value: string; unit?: string; icon?: React.ReactNode; tint: string }) {
  return (
    <div className={`px-4 py-4 ${tint}`}>
      <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-soft">
        {icon}{label}
      </p>
      <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-ink leading-none">
        {value}
        {unit && <span className="ml-1 text-xs font-medium text-ink-soft">{unit}</span>}
      </p>
    </div>
  );
}

// ── Next up block ─────────────────────────────────────────────────────────────
function NextUpBlock({ lesson, completedToday, bonusActive }: { lesson: LessonSummary; completedToday: number; bonusActive: boolean }) {
  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="group block rounded-2xl border-2 border-line bg-cream overflow-hidden shadow-hard-lg press"
    >
      <div className="h-2.5 bg-clay border-b-2 border-line" />
      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-clay-tint text-clay-deep px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-clay animate-pulse" /> Up next
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink-faint">{lessonTypeLabel(lesson.type)}</span>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-ink-faint">
            <Clock size={12} /> {lesson.estimatedSec}s
          </span>
          {bonusActive && (
            <span className="inline-flex items-center rounded-full border-2 border-line bg-sun text-ink px-2 py-0.5 font-mono text-[10px] font-bold">1.5&times; XP</span>
          )}
        </div>
        <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink leading-tight max-w-[24ch]">
          {toTitleCase(lesson.headline)}
        </h3>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-soft min-w-0 truncate">
            {completedToday > 0 ? `${completedToday} done today — keep going.` : "Pick up where you left off."}
          </p>
          <span className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-clay text-cream border-2 border-line h-11 px-5 text-sm font-bold">
            {completedToday > 0 ? "Continue" : "Start"}
            <ArrowRight size={16} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function AllDoneBlock({ skill, completed }: { skill: string; completed: number }) {
  return (
    <div className="relative rounded-2xl border-2 border-line bg-teal-tint p-7 sm:p-8 overflow-hidden shadow-hard">
      <div className="h-2.5 bg-teal border-b-2 border-line absolute top-0 inset-x-0" />
      <div className="flex items-center gap-5">
        <Mascot state="celebrate" size={80} className="shrink-0" />
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Path complete</h3>
          <p className="mt-2 text-sm text-ink-soft max-w-[42ch] leading-relaxed">
            You finished all {completed} lessons of {toTitleCase(skill)}. The whole curriculum, cleared.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Path: sectioned list with collapsible weeks ───────────────────────────────
function PathRoute({ weeks, nextLessonId, weekThemes }: { weeks: WeekGroup[]; nextLessonId: string | null; weekThemes: Record<number, string> }) {
  const activeWeek = weeks.find((w) => w.lessons.some((l) => l.id === nextLessonId))?.weekNumber
    ?? weeks.find((w) => w.lessons.some((l) => !l.completed))?.weekNumber
    ?? weeks[weeks.length - 1]?.weekNumber;

  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => new Set([activeWeek]));

  function toggle(wn: number) {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(wn)) next.delete(wn);
      else next.add(wn);
      return next;
    });
  }

  return (
    <div className="rounded-xl border-2 border-line bg-cream overflow-hidden shadow-hard divide-y-2 divide-line">
      {weeks.map((week) => {
        const completed = week.lessons.filter((l) => l.completed).length;
        const allDone = completed === week.lessons.length;
        const isOpen = openWeeks.has(week.weekNumber);
        const wpct = week.lessons.length ? Math.round((completed / week.lessons.length) * 100) : 0;
        return (
          <div key={week.weekNumber}>
            <button onClick={() => toggle(week.weekNumber)} className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left group hover:bg-paper-2 transition-colors">
              <span className={`grid place-items-center w-8 h-8 rounded-lg border-2 border-line font-mono text-xs font-bold tabular-nums shrink-0
                ${allDone ? "bg-teal text-cream" : "bg-sun-tint text-ink"}`}>
                {String(week.weekNumber).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm font-bold text-ink truncate">
                {weekThemes[week.weekNumber] ?? `Week ${week.weekNumber}`}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:block w-16 h-2.5 rounded-full bg-paper border-2 border-line overflow-hidden">
                  <div className={`h-full ${allDone ? "bg-teal" : "bg-clay"}`} style={{ width: `${wpct}%` }} />
                </div>
                <span className="font-mono text-[11px] font-bold text-ink-soft tabular-nums">{completed}/{week.lessons.length}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-ink-soft">
                  <CaretDown size={14} weight="bold" />
                </motion.span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="rows"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="px-4 sm:px-5 pb-3 border-t-2 border-dashed border-ink/25 divide-y-2 divide-dashed divide-ink/20">
                    {week.lessons.map((lesson, li) => (
                      <LessonRow key={lesson.id} lesson={lesson} index={li} isNext={lesson.id === nextLessonId} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function LessonRow({ lesson, index, isNext }: { lesson: LessonSummary; index: number; isNext: boolean }) {
  const NodeIcon = NODE_ICON[lesson.type] ?? BookOpen;

  const glyph = lesson.locked ? (
    <span className="grid place-items-center w-7 h-7 rounded-full bg-paper border-2 border-ink/30 text-ink-faint">
      <Lock size={12} weight="bold" />
    </span>
  ) : isNext ? (
    <span className="grid place-items-center w-7 h-7 rounded-full bg-clay text-cream border-2 border-line shadow-hard-sm">
      <NodeIcon size={13} weight="fill" />
    </span>
  ) : (
    <span className="grid place-items-center w-7 h-7 rounded-full bg-teal text-cream border-2 border-line">
      <Check size={13} weight="bold" />
    </span>
  );

  const label = (
    <>
      <span className="grid place-items-center shrink-0">{glyph}</span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink-faint">
          {String(index + 1).padStart(2, "0")} · {isNext ? "Up next" : lessonTypeLabel(lesson.type)}
        </p>
        <p className={`text-sm truncate ${isNext ? "font-bold text-ink" : lesson.locked ? "text-ink-faint" : "font-medium text-ink-soft"}`}>
          {toTitleCase(lesson.headline)}
        </p>
      </div>
    </>
  );

  if (lesson.locked) {
    return <div className="flex items-center gap-3 py-3 opacity-70">{label}</div>;
  }

  return (
    <Link href={`/lesson/${lesson.id}`} className="flex items-center gap-3 py-3 group active:scale-[0.995] transition-transform">
      {label}
      {isNext ? (
        <ArrowRight size={16} weight="bold" className="shrink-0 text-clay group-hover:translate-x-0.5 transition-transform" />
      ) : (
        <span className="shrink-0 font-mono text-xs font-bold text-teal-deep tabular-nums">{lesson.score}%</span>
      )}
    </Link>
  );
}

// ── Achievements ──────────────────────────────────────────────────────────────
function AchievementShelf({ earned }: { earned: DashboardData["achievements"] }) {
  const earnedMap = new Map(earned.map((a) => [a.type, a]));
  const allTypes = Object.keys(ACHIEVEMENTS) as (keyof typeof ACHIEVEMENTS)[];

  if (earned.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-ink/40 bg-cream px-5 py-3">
        <Mascot state="sleeping" size={64} className="shrink-0" />
        <p className="text-sm text-ink-soft">No badges yet. Clear your first lesson to light one up.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
      {allTypes.map((type) => {
        const meta = ACHIEVEMENTS[type];
        const unlocked = earnedMap.has(type);
        return (
          <div
            key={type}
            title={meta.desc}
            className={`rounded-xl border-2 border-line p-3 text-center ${
              unlocked ? "bg-clay-tint shadow-hard-sm" : "bg-cream opacity-55"
            }`}
          >
            <span className={`grid place-items-center w-10 h-10 rounded-lg mx-auto mb-2 border-2 border-line ${unlocked ? "bg-clay text-cream" : "bg-paper text-ink-faint"}`}>
              <Icon name={meta.icon} size={18} weight={unlocked ? "fill" : "regular"} />
            </span>
            <span className="block text-[11px] font-bold text-ink truncate">{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
interface WeekGroup { weekNumber: number; lessons: LessonSummary[] }

function groupByWeek(lessons: LessonSummary[]): WeekGroup[] {
  const map = new Map<number, LessonSummary[]>();
  for (const l of lessons) {
    if (!map.has(l.weekNumber)) map.set(l.weekNumber, []);
    map.get(l.weekNumber)!.push(l);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([weekNumber, lessons]) => ({ weekNumber, lessons }));
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
