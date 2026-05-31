"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Lock, Trophy, Confetti, Clock,
  CaretLeft, BookOpen, Lightbulb, Code, Scales, Sparkle, Repeat,
} from "@phosphor-icons/react";
import type { DashboardData, LessonSummary } from "@/lib/queries";
import { toTitleCase } from "@/lib/format";
import { StreakCounter } from "../ui/StreakCounter";
import { XPBar } from "../ui/XPBar";
import { lessonTypeLabel } from "../ui/LessonTypeBadge";
import { Icon } from "../ui/Icon";
import { ACHIEVEMENTS } from "@/lib/achievements";


const NODE_ICON: Record<string, React.ElementType> = {
  concept_card:   BookOpen,
  analogy:        Lightbulb,
  code_snippet:   Code,
  myth_vs_reality: Scales,
  did_you_know:   Sparkle,
  flashcard:      Repeat,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

export function Dashboard({ data }: { data: DashboardData }) {
  const firstName = data.name?.split(" ")[0];
  const weeks = groupByWeek(data.lessons);
  const nextLesson = data.lessons.find((l) => l.id === data.nextLessonId);

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-28 md:pb-12 overflow-x-hidden"
    >
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm hover:border-zinc-300 hover:text-ink transition-all active:scale-95 mb-4"
        >
          <CaretLeft size={11} weight="bold" />
          All paths
        </Link>
        <p className="text-sm text-zinc-500">{greeting()}{firstName ? `, ${firstName}` : ""}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-ink leading-none mt-1">
          {toTitleCase(data.path.skill)}
        </h1>
      </motion.div>

      {/* Top bento: continue card + stats */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div variants={item} className="lg:col-span-2 min-w-0">
          {data.allDone || !nextLesson ? (
            <AllDoneCard skill={data.path.skill} completed={data.totalCompleted} />
          ) : (
            <ContinueCard lesson={nextLesson} completedToday={data.completedToday} bonusActive={data.bonusXpActive} />
          )}
        </motion.div>

        <motion.div variants={item} className="flex flex-col gap-4 sm:gap-6 min-w-0">
          <div className="rounded-[2rem] bg-white border border-zinc-200/70 p-6 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Streak</p>
            <StreakCounter days={data.streak.current} />
            <p className="mt-2 text-xs text-zinc-400">
              Longest <span className="font-mono text-zinc-600">{data.streak.longest}</span> days
            </p>
          </div>
          <div className="rounded-[2rem] bg-white border border-zinc-200/70 p-6 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Progress</p>
            <XPBar level={data.xp.level} progressPct={data.xp.progressPct} toNext={data.xp.toNext} totalXp={data.xp.total} />
          </div>
        </motion.div>
      </div>

      {/* Path section */}
      <motion.section variants={item} className="mt-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Your path</h2>
          <span className="text-sm text-zinc-500 font-mono tabular-nums">
            {data.totalCompleted}/{data.totalLessons} lessons
          </span>
        </div>
        <PathRoute weeks={weeks} nextLessonId={data.nextLessonId} weekThemes={data.weekThemes} />
      </motion.section>

      {/* Achievements */}
      <motion.section variants={item} className="mt-14">
        <h2 className="text-lg font-semibold tracking-tight text-ink mb-5">Achievements</h2>
        <AchievementShelf earned={data.achievements} />
      </motion.section>
    </motion.main>
  );
}

// ── Path route: vertical timeline view ───────────────────────────────────────
function PathRoute({ weeks, nextLessonId, weekThemes }: { weeks: WeekGroup[]; nextLessonId: string | null; weekThemes: Record<number, string> }) {
  // Find which week contains the next lesson — open it by default
  const activeWeek = weeks.find((w) => w.lessons.some((l) => l.id === nextLessonId))?.weekNumber
    ?? weeks.find((w) => w.lessons.some((l) => !l.completed))?.weekNumber
    ?? weeks[weeks.length - 1]?.weekNumber;

  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => new Set([activeWeek]));

  function toggle(wn: number) {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      next.has(wn) ? next.delete(wn) : next.add(wn);
      return next;
    });
  }

  return (
    <div className="max-w-2xl">
      {weeks.map((week, wi) => {
        const completed = week.lessons.filter((l) => l.completed).length;
        const allDone = completed === week.lessons.length;
        const isOpen = openWeeks.has(week.weekNumber);
        return (
          <div key={week.weekNumber} className={wi > 0 ? "mt-2" : ""}>
            {/* Week header — clickable to collapse */}
            <button
              onClick={() => toggle(week.weekNumber)}
              className="w-full relative flex items-center gap-4 py-4 text-left group"
            >
              <div className="shrink-0 w-12 flex justify-center">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm transition-colors ${
                  allDone ? "bg-emerald-500 text-white" : "bg-zinc-900 text-white"
                }`}>
                  {String(week.weekNumber).padStart(2, "0")}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                <span className="text-sm font-semibold text-ink">
                  {weekThemes[week.weekNumber] ?? `Week ${week.weekNumber}`}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${allDone ? "bg-emerald-500" : "bg-accent-400"}`}
                      style={{ width: `${week.lessons.length ? Math.round((completed / week.lessons.length) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 tabular-nums">{completed}/{week.lessons.length}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-zinc-400"
                  >
                    <ArrowRight size={13} className="rotate-90" />
                  </motion.div>
                </div>
              </div>
            </button>

            {/* Lessons timeline — collapsible */}
            <AnimatePresence initial={false}>
            {isOpen && <motion.div
              key="lessons"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}
            >
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-zinc-200" />

              {week.lessons.map((lesson, li) => {
                const isNext = lesson.id === nextLessonId;
                const NodeIcon = NODE_ICON[lesson.type] ?? BookOpen;

                return (
                  <div key={lesson.id} className="relative flex items-start gap-4 pb-3">
                    {/* Node */}
                    <div className="shrink-0 w-12 flex justify-center pt-3 relative z-10">
                      {lesson.locked ? (
                        <div className="w-5 h-5 rounded-full bg-zinc-200 border-2 border-zinc-300 flex items-center justify-center">
                          <Lock size={9} weight="bold" className="text-zinc-400" />
                        </div>
                      ) : isNext ? (
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-accent-400/30 animate-ping" />
                          <div className="relative w-7 h-7 rounded-full bg-accent-400 border-2 border-accent-500 flex items-center justify-center shadow-[0_3px_0_var(--color-accent-600)]">
                            <NodeIcon size={13} weight="fill" className="text-ink" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center">
                          <Check size={9} weight="bold" className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Lesson card */}
                    {lesson.locked ? (
                      <div className="flex-1 mb-1 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 opacity-50">
                        <p className="text-[10px] font-mono text-zinc-400 mb-0.5">
                          {String(li + 1).padStart(2, "0")} · {lessonTypeLabel(lesson.type)}
                        </p>
                        <p className="text-sm text-zinc-400 truncate">{toTitleCase(lesson.headline)}</p>
                      </div>
                    ) : isNext ? (
                      <Link
                        href={`/lesson/${lesson.id}`}
                        className="group flex-1 mb-1 rounded-2xl border-2 border-accent-400 bg-accent-50 px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent-100 transition-colors active:scale-[0.99]"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono text-accent-600 mb-0.5">
                            {String(li + 1).padStart(2, "0")} · Up next
                          </p>
                          <p className="text-sm font-semibold text-ink truncate">{toTitleCase(lesson.headline)}</p>
                        </div>
                        <ArrowRight size={15} weight="bold" className="shrink-0 text-accent-500 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <Link
                        href={`/lesson/${lesson.id}`}
                        className="group flex-1 mb-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 flex items-center justify-between gap-3 hover:border-zinc-300 hover:shadow-sm transition-all active:scale-[0.99]"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono text-zinc-400 mb-0.5">
                            {String(li + 1).padStart(2, "0")} · {lessonTypeLabel(lesson.type)}
                          </p>
                          <p className="text-sm font-medium text-ink truncate">{toTitleCase(lesson.headline)}</p>
                        </div>
                        <span className="shrink-0 font-mono text-xs font-semibold text-emerald-600">{lesson.score}%</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
            </motion.div>}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Continue / AllDone cards ──────────────────────────────────────────────────
function ContinueCard({ lesson, completedToday, bonusActive }: { lesson: LessonSummary; completedToday: number; bonusActive: boolean }) {
  return (
    <div className="relative h-full rounded-[2rem] bg-ink text-canvas p-7 sm:p-9 overflow-hidden flex flex-col justify-between min-h-[260px]">
      <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-accent-500/20 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-accent-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {lessonTypeLabel(lesson.type)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
            <Clock size={14} /> {lesson.estimatedSec}s read
          </span>
          {bonusActive && <span className="text-xs font-semibold text-accent-300">1.5× XP active</span>}
        </div>
        <h3 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tighter leading-tight max-w-[22ch]">
          {toTitleCase(lesson.headline)}
        </h3>
      </div>
      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400 min-w-0">
          {completedToday > 0 ? `${completedToday} done today — keep the momentum.` : "Your next lesson is ready."}
        </p>
        <Link
          href={`/lesson/${lesson.id}`}
          className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-accent-400 text-ink h-12 px-6 font-semibold tracking-tight shadow-[0_4px_0_var(--color-accent-600)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-accent-600)] transition-all"
        >
          {completedToday > 0 ? "Continue" : "Start"}
          <ArrowRight size={18} weight="bold" />
        </Link>
      </div>
    </div>
  );
}

function AllDoneCard({ skill, completed }: { skill: string; completed: number }) {
  return (
    <div className="h-full rounded-[2rem] bg-ink text-canvas p-9 flex flex-col justify-center items-start min-h-[260px]">
      <span className="grid place-items-center w-14 h-14 rounded-2xl bg-accent-400 text-ink mb-5">
        <Confetti size={28} weight="fill" />
      </span>
      <h3 className="text-2xl sm:text-3xl font-bold tracking-tighter">Path complete</h3>
      <p className="mt-2 text-zinc-400 max-w-[40ch]">
        You finished all {completed} lessons of {skill}. That's the whole curriculum.
      </p>
    </div>
  );
}

// ── Achievements ──────────────────────────────────────────────────────────────
function AchievementShelf({ earned }: { earned: DashboardData["achievements"] }) {
  const earnedMap = new Map(earned.map((a) => [a.type, a]));
  const allTypes = Object.keys(ACHIEVEMENTS) as (keyof typeof ACHIEVEMENTS)[];

  if (earned.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-zinc-300 p-8 text-center">
        <span className="grid place-items-center w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto mb-3">
          <Trophy size={22} />
        </span>
        <p className="text-sm text-zinc-500">No badges yet. Finish your first lesson to light one up.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {allTypes.map((type) => {
        const meta = ACHIEVEMENTS[type];
        const unlocked = earnedMap.has(type);
        return (
          <div key={type} className={`rounded-2xl border p-4 text-center ${unlocked ? "border-accent-200 bg-accent-50" : "border-zinc-200/70 bg-white opacity-60"}`} title={meta.desc}>
            <span className={`grid place-items-center w-10 h-10 rounded-xl mx-auto mb-2 ${unlocked ? "bg-accent-400 text-ink" : "bg-zinc-100 text-zinc-300"}`}>
              <Icon name={meta.icon} size={20} weight={unlocked ? "fill" : "regular"} />
            </span>
            <span className="block text-xs font-medium text-ink truncate">{meta.label}</span>
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
