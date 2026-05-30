"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Check, Lock, Trophy, Confetti } from "@phosphor-icons/react";
import type { DashboardData, LessonSummary } from "@/lib/queries";
import { StreakCounter } from "../ui/StreakCounter";
import { XPBar } from "../ui/XPBar";
import { LessonTypeBadge, lessonTypeLabel } from "../ui/LessonTypeBadge";
import { Icon } from "../ui/Icon";
import { ACHIEVEMENTS } from "@/lib/achievements";

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
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-28 md:pb-12"
    >
      <motion.div variants={item} className="mb-8">
        <p className="text-sm text-zinc-500">{greeting()}{firstName ? `, ${firstName}` : ""}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-ink leading-none mt-1">
          {data.path.skill}
        </h1>
      </motion.div>

      {/* Bento top row: continue (wide) + stats (narrow) */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          {data.allDone || !nextLesson ? (
            <AllDoneCard skill={data.path.skill} completed={data.totalCompleted} />
          ) : (
            <ContinueCard
              lesson={nextLesson}
              completedToday={data.completedToday}
              bonusActive={data.bonusXpActive}
            />
          )}
        </motion.div>

        <motion.div variants={item} className="flex flex-col gap-4 sm:gap-6">
          <div className="rounded-[2rem] bg-white border border-zinc-200/70 p-6 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Streak</p>
            <StreakCounter days={data.streak.current} />
            <p className="mt-2 text-xs text-zinc-400">
              Longest <span className="font-mono text-zinc-600">{data.streak.longest}</span> days
            </p>
          </div>
          <div className="rounded-[2rem] bg-white border border-zinc-200/70 p-6 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Progress</p>
            <XPBar
              level={data.xp.level}
              progressPct={data.xp.progressPct}
              toNext={data.xp.toNext}
              totalXp={data.xp.total}
            />
          </div>
        </motion.div>
      </div>

      {/* Path map */}
      <motion.section variants={item} className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Your path</h2>
          <span className="font-mono text-sm text-zinc-500 tabular-nums">
            {data.totalCompleted}/{data.totalLessons} lessons
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-8">
          {weeks.map((week) => (
            <div key={week.weekNumber}>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-xs font-semibold text-accent-700 bg-accent-50 rounded-full px-2.5 py-1">
                  Week {week.weekNumber}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {week.lessons.filter((l) => l.completed).length}/{week.lessons.length}
                </span>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {week.lessons.map((lesson) => (
                  <LessonRow key={lesson.id} lesson={lesson} isNext={lesson.id === data.nextLessonId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Achievements */}
      <motion.section variants={item} className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight text-ink mb-5">Achievements</h2>
        <AchievementShelf earned={data.achievements} />
      </motion.section>
    </motion.main>
  );
}

function ContinueCard({
  lesson,
  completedToday,
  bonusActive,
}: {
  lesson: LessonSummary;
  completedToday: number;
  bonusActive: boolean;
}) {
  return (
    <div className="relative h-full rounded-[2rem] bg-ink text-canvas p-7 sm:p-9 overflow-hidden flex flex-col justify-between min-h-[260px]">
      <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-accent-500/20 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-3 flex-wrap">
          <LessonTypeBadge type={lesson.type} className="bg-white/10 text-accent-200" />
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
            <Clock size={14} /> {lesson.estimatedSec}s read
          </span>
          {bonusActive && (
            <span className="text-xs font-semibold text-accent-300">1.5× XP active</span>
          )}
        </div>
        <h3 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tighter leading-tight max-w-[22ch]">
          {lesson.headline}
        </h3>
      </div>
      <div className="relative mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">
          {completedToday > 0
            ? `${completedToday} done today — keep the momentum.`
            : "Your next lesson is ready."}
        </p>
        <Link
          href={`/lesson/${lesson.id}`}
          className="inline-flex items-center gap-2 rounded-2xl bg-accent-400 text-ink h-12 px-6
            font-semibold tracking-tight shadow-[0_4px_0_var(--color-accent-600)]
            active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-accent-600)] transition-all"
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
        You finished all {completed} lessons of {skill}. That’s the whole curriculum — come back to
        keep your streak warm while we cook up what’s next.
      </p>
    </div>
  );
}

function LessonRow({ lesson, isNext }: { lesson: LessonSummary; isNext: boolean }) {
  const base =
    "flex items-center gap-3 rounded-2xl border p-4 transition-colors";
  if (lesson.completed) {
    return (
      <Link href={`/lesson/${lesson.id}`} className={`${base} border-zinc-200/70 bg-white hover:border-zinc-300`}>
        <span className="grid place-items-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
          <Check size={16} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink truncate">{lesson.headline}</span>
          <span className="text-xs text-zinc-400">{lessonTypeLabel(lesson.type)}</span>
        </span>
        <span className="font-mono text-xs text-emerald-600 tabular-nums">{lesson.score}%</span>
      </Link>
    );
  }
  if (isNext) {
    return (
      <Link
        href={`/lesson/${lesson.id}`}
        className={`${base} border-accent-400 bg-accent-50 ring-2 ring-accent-400/30`}
      >
        <span className="grid place-items-center w-8 h-8 rounded-xl bg-accent-400 text-ink shrink-0">
          <ArrowRight size={16} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink truncate">{lesson.headline}</span>
          <span className="text-xs text-accent-700">Up next · {lessonTypeLabel(lesson.type)}</span>
        </span>
      </Link>
    );
  }
  return (
    <div className={`${base} border-zinc-200/60 bg-zinc-50/60 opacity-70`}>
      <span className="grid place-items-center w-8 h-8 rounded-xl bg-zinc-200 text-zinc-400 shrink-0">
        <Lock size={14} weight="bold" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-zinc-500 truncate">{lesson.headline}</span>
        <span className="text-xs text-zinc-400">{lessonTypeLabel(lesson.type)}</span>
      </span>
    </div>
  );
}

function AchievementShelf({ earned }: { earned: DashboardData["achievements"] }) {
  const earnedMap = new Map(earned.map((a) => [a.type, a]));
  const allTypes = Object.keys(ACHIEVEMENTS) as (keyof typeof ACHIEVEMENTS)[];

  if (earned.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-zinc-300 p-8 text-center">
        <span className="grid place-items-center w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto mb-3">
          <Trophy size={22} />
        </span>
        <p className="text-sm text-zinc-500">
          No badges yet. Finish your first lesson to light one up.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {allTypes.map((type) => {
        const meta = ACHIEVEMENTS[type];
        const unlocked = earnedMap.has(type);
        return (
          <div
            key={type}
            className={`rounded-2xl border p-4 text-center ${
              unlocked ? "border-accent-200 bg-accent-50" : "border-zinc-200/70 bg-white opacity-60"
            }`}
            title={meta.desc}
          >
            <span
              className={`grid place-items-center w-10 h-10 rounded-xl mx-auto mb-2 ${
                unlocked ? "bg-accent-400 text-ink" : "bg-zinc-100 text-zinc-300"
              }`}
            >
              <Icon name={meta.icon} size={20} weight={unlocked ? "fill" : "regular"} />
            </span>
            <span className="block text-xs font-medium text-ink truncate">{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface WeekGroup {
  weekNumber: number;
  lessons: LessonSummary[];
}
function groupByWeek(lessons: LessonSummary[]): WeekGroup[] {
  const map = new Map<number, LessonSummary[]>();
  for (const l of lessons) {
    if (!map.has(l.weekNumber)) map.set(l.weekNumber, []);
    map.get(l.weekNumber)!.push(l);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekNumber, lessons]) => ({ weekNumber, lessons }));
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
