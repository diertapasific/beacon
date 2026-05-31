"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plus, BookOpen, Check } from "@phosphor-icons/react";
import type { PathSummary } from "@/lib/queries";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function PathList({ paths, userName }: { paths: PathSummary[]; userName: string | null }) {
  const firstName = userName?.split(" ")[0];

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24"
    >
      <motion.div variants={item} className="mb-8">
        <p className="text-sm text-zinc-500">{greeting()}{firstName ? `, ${firstName}` : ""}</p>
        <div className="flex items-center justify-between gap-4 mt-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-ink leading-none">
            Your paths
          </h1>
          <Link
            href="/onboarding"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-ink text-canvas px-4 py-2.5
              text-sm font-semibold transition-all active:scale-[0.97] hover:bg-zinc-800"
          >
            <Plus size={16} weight="bold" />
            New path
          </Link>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4">
        {paths.map((path) => {
          const pct = path.totalLessons
            ? Math.round((path.completedLessons / path.totalLessons) * 100)
            : 0;
          const done = path.completedLessons === path.totalLessons && path.totalLessons > 0;

          return (
            <motion.div key={path.id} variants={item}>
              <Link
                href={`/dashboard/${path.id}`}
                className="group block rounded-[2rem] bg-white border border-zinc-200/70
                  p-6 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.1)]
                  transition-all hover:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.14)]
                  hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        {LEVEL_LABELS[path.level] ?? path.level}
                      </span>
                      {done && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold
                          text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                          <Check size={11} weight="bold" />
                          Complete
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-ink truncate">
                      {path.skill}
                    </h2>
                    {path.goal && (
                      <p className="mt-1 text-sm text-zinc-500 line-clamp-1">{path.goal}</p>
                    )}
                  </div>
                  <div className="shrink-0 grid place-items-center w-10 h-10 rounded-xl
                    bg-zinc-100 group-hover:bg-accent-100 transition-colors">
                    <ArrowRight size={18} className="text-zinc-500 group-hover:text-accent-600 transition-colors" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <BookOpen size={13} />
                      {path.completedLessons} / {path.totalLessons} lessons
                    </div>
                    <span className="text-xs font-mono font-semibold text-zinc-600">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-accent-400"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.main>
  );
}
