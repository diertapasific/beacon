"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, Check, Trash, X } from "@phosphor-icons/react";
import type { PathSummary } from "@/lib/queries";
import { toTitleCase } from "@/lib/format";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 110, damping: 20 } },
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// Resolved post-mount to avoid a UTC-vs-local hydration mismatch (React #418).
function useGreeting(): string {
  const [hello, setHello] = useState("Welcome");
  useEffect(() => {
    const h = new Date().getHours();
    setHello(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);
  return hello;
}

function PathRow({ path, onDeleted }: { path: PathSummary; onDeleted: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const pct = path.totalLessons ? Math.round((path.completedLessons / path.totalLessons) * 100) : 0;
  const done = path.completedLessons === path.totalLessons && path.totalLessons > 0;

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/paths/${path.id}`, { method: "DELETE" });
      onDeleted(path.id);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="relative group rounded-2xl border-2 border-line bg-cream shadow-hard press">
      <Link href={`/dashboard/${path.id}`} className="block p-5 sm:p-6 pr-12">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink-faint">
            {LEVEL_LABELS[path.level] ?? path.level}
          </span>
          {done ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-teal-deep bg-teal-tint border-2 border-line rounded-full px-2 py-0.5">
              <Check size={10} weight="bold" /> Complete
            </span>
          ) : path.totalPhases > 1 ? (
            <span className="font-mono text-[10px] font-bold text-ink-faint border-2 border-line rounded-full px-2 py-0.5">
              Phase {path.currentPhase}/{path.totalPhases}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink truncate">{toTitleCase(path.skill)}</h2>
          <ArrowRight size={18} weight="bold" className="shrink-0 text-ink-faint group-hover:text-clay group-hover:translate-x-0.5 transition-all" />
        </div>
        {path.goal && <p className="mt-0.5 text-sm text-ink-soft line-clamp-1">{path.goal}</p>}

        <div className="mt-4 flex items-center gap-3">
          <div className="h-2.5 flex-1 max-w-xs rounded-full bg-paper border-2 border-line overflow-hidden">
            <motion.div
              className={`h-full ${done ? "bg-teal" : "bg-clay"}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold text-ink-soft tabular-nums shrink-0">
            {path.completedLessons}/{path.totalLessons}
          </span>
        </div>
      </Link>

      {/* Delete affordance */}
      <div className="absolute top-4 right-4">
        <AnimatePresence mode="wait">
          {!confirming ? (
            <motion.button
              key="trash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirming(true)}
              aria-label="Delete path"
              className="grid place-items-center w-8 h-8 rounded-lg border-2 border-transparent text-ink-faint hover:text-berry hover:border-line hover:bg-berry-tint transition-colors
                opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Trash size={15} />
            </motion.button>
          ) : (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center gap-2 rounded-lg border-2 border-line bg-paper px-2.5 py-1.5 shadow-hard-sm"
            >
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="font-mono text-xs font-bold uppercase text-berry hover:underline transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setConfirming(false)} className="text-ink-soft hover:text-ink transition-colors">
                <X size={14} weight="bold" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function PathList({ paths: initialPaths, userName }: { paths: PathSummary[]; userName: string | null }) {
  const router = useRouter();
  const hello = useGreeting();
  const firstName = userName?.split(" ")[0];
  const [paths, setPaths] = useState(initialPaths);

  function handleDeleted(id: string) {
    const next = paths.filter((p) => p.id !== id);
    setPaths(next);
    if (next.length === 0) router.push("/onboarding");
  }

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-20"
    >
      <motion.div variants={item} className="mb-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep">
          {hello}{firstName ? `, ${firstName}` : ""}
        </p>
        <div className="flex items-center justify-between gap-4 mt-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-none">Your paths</h1>
          <Link
            href="/onboarding"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-clay text-cream border-2 border-line px-4 py-2.5
              text-sm font-bold shadow-hard press"
          >
            <Plus size={16} weight="bold" />
            <span className="hidden sm:inline">New path</span>
          </Link>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {paths.map((path) => (
            <motion.div
              key={path.id}
              variants={item}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "visible" }}
            >
              <PathRow path={path} onDeleted={handleDeleted} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
