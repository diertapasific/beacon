"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Lightbulb,
  Sparkle,
  House,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { Button } from "../ui/Button";
import { LessonTypeBadge } from "../ui/LessonTypeBadge";
import { AchievementModal, type UnlockedAchievement } from "../ui/AchievementModal";

interface QuizQuestion {
  type: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

export interface LessonContent {
  id: string;
  type: string;
  headline: string;
  coreIdea: string;
  example: string;
  realWorldUse: string;
  estimatedSec: number;
  quiz: QuizQuestion[];
}

interface SubmitResult {
  passed: boolean;
  score: number;
  xpEarned: number;
  leveledUp?: boolean;
  newLevel?: number;
  streak?: number;
  unlockedAchievements?: UnlockedAchievement[];
  message?: string;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 18 } },
};

export function LessonExperience({
  lesson,
  lessonNumber,
  totalLessons,
  subsequentLessonId,
}: {
  lesson: LessonContent;
  lessonNumber: number;
  totalLessons: number;
  subsequentLessonId: string | null;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"lesson" | "quiz" | "result">("lesson");
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => lesson.quiz.map(() => null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [achievementIndex, setAchievementIndex] = useState(0);

  const progressPct = Math.round((lessonNumber / totalLessons) * 100);
  const allAnswered = answers.every((a) => a !== null);

  function selectAnswer(qIndex: number, option: string) {
    if (answers[qIndex] !== null) return; // lock once answered
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = option;
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data: SubmitResult = await res.json();
      setResult(data);
      setPhase("result");
      if (data.passed && data.leveledUp) {
        setTimeout(
          () =>
            confetti({
              particleCount: 160,
              spread: 100,
              origin: { y: 0.5 },
              colors: ["#f59e0b", "#fbbf24", "#1c1917", "#fde68a"],
            }),
          250
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setAnswers(lesson.quiz.map(() => null));
    setResult(null);
    setPhase("lesson");
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Top progress bar */}
      <header className="sticky top-0 z-20 bg-canvas/85 backdrop-blur-md border-b border-zinc-200/70">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-ink transition-colors active:scale-95 shrink-0"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden">
            <motion.div
              className="h-full bg-accent-400"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="font-mono text-xs text-zinc-500 tabular-nums shrink-0">
            {lessonNumber}/{totalLessons}
          </span>
        </div>
      </header>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {phase === "lesson" && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              <LessonCardView lesson={lesson} onReady={() => setPhase("quiz")} />
            </motion.div>
          )}

          {phase === "quiz" && (
            <motion.div
              key="quiz"
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
            >
              <motion.h2
                variants={item}
                className="text-2xl font-bold tracking-tighter text-ink mb-6"
              >
                Quick check
              </motion.h2>
              <div className="flex flex-col gap-5">
                {lesson.quiz.map((q, i) => (
                  <motion.div key={i} variants={item}>
                    <QuizCard
                      question={q}
                      index={i}
                      selected={answers[i]}
                      onSelect={(opt) => selectAnswer(i, opt)}
                    />
                  </motion.div>
                ))}
              </div>
              <motion.div variants={item} className="mt-8">
                <Button
                  onClick={submit}
                  size="lg"
                  className="w-full"
                  disabled={!allAnswered || submitting}
                >
                  {submitting ? "Checking…" : "Submit answers"}
                  {!submitting && <ArrowRight size={18} weight="bold" />}
                </Button>
                {!allAnswered && (
                  <p className="mt-2 text-center text-xs text-zinc-400">
                    Answer every question to submit
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}

          {phase === "result" && result && (
            <ResultView
              key="result"
              result={result}
              subsequentLessonId={subsequentLessonId}
              onRetry={retry}
              onContinue={(href) => {
                router.push(href);
                router.refresh();
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Achievement celebration queue */}
      <AnimatePresence>
        {phase === "result" &&
          result?.unlockedAchievements &&
          achievementIndex < result.unlockedAchievements.length && (
            <AchievementModal
              achievement={result.unlockedAchievements[achievementIndex]}
              onClose={() => setAchievementIndex((i) => i + 1)}
            />
          )}
      </AnimatePresence>
    </div>
  );
}

function LessonCardView({ lesson, onReady }: { lesson: LessonContent; onReady: () => void }) {
  return (
    <article>
      <LessonTypeBadge type={lesson.type} />
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tighter leading-none text-ink">
        {lesson.headline}
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-zinc-700 max-w-[60ch]">{lesson.coreIdea}</p>

      <div className="mt-8 rounded-2xl bg-zinc-900 text-zinc-100 p-5 overflow-x-auto">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Example</p>
        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{lesson.example}</pre>
      </div>

      <div className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-700 mb-2">
          <Sparkle size={14} weight="fill" /> In the wild
        </p>
        <p className="text-sm leading-relaxed text-ink/80">{lesson.realWorldUse}</p>
      </div>

      <Button onClick={onReady} size="lg" className="w-full mt-8">
        <Lightbulb size={18} weight="fill" /> I’m ready — take the quiz
      </Button>
    </article>
  );
}

function QuizCard({
  question,
  index,
  selected,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selected: string | null;
  onSelect: (option: string) => void;
}) {
  const answered = selected !== null;
  const gotItRight = selected === question.correct;

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 sm:p-6">
      <p className="flex gap-2 text-base font-semibold text-ink">
        <span className="font-mono text-accent-600">{index + 1}.</span>
        <span>{question.question}</span>
      </p>
      <div className="mt-4 grid gap-2.5">
        {question.options.map((option) => {
          const isCorrect = option === question.correct;
          const isChosen = option === selected;
          let style = "border-zinc-200 bg-white hover:border-zinc-300";
          let icon = null;
          if (answered) {
            if (isCorrect) {
              style = "border-emerald-400 bg-emerald-50 text-emerald-800";
              icon = <Check size={16} weight="bold" className="text-emerald-600" />;
            } else if (isChosen) {
              style = "border-rose-400 bg-rose-50 text-rose-800";
              icon = <X size={16} weight="bold" className="text-rose-600" />;
            } else {
              style = "border-zinc-200 bg-white opacity-60";
            }
          }
          return (
            <motion.button
              key={option}
              onClick={() => onSelect(option)}
              disabled={answered}
              animate={answered && isChosen && !isCorrect ? { x: [-6, 6, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`flex items-center justify-between gap-3 text-left rounded-xl border px-4 py-3
                text-sm transition-colors disabled:cursor-default ${style}`}
            >
              <span>{option}</span>
              {icon}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <p
              className={`mt-3 text-sm leading-relaxed ${
                gotItRight ? "text-emerald-700" : "text-zinc-600"
              }`}
            >
              <span className="font-semibold">{gotItRight ? "Correct. " : "Not quite. "}</span>
              {question.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultView({
  result,
  subsequentLessonId,
  onRetry,
  onContinue,
}: {
  result: SubmitResult;
  subsequentLessonId: string | null;
  onRetry: () => void;
  onContinue: (href: string) => void;
}) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="text-center pt-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.05 }}
        className={`mx-auto grid place-items-center w-20 h-20 rounded-3xl ${
          result.passed ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
        }`}
      >
        {result.passed ? <Check size={40} weight="bold" /> : <ArrowsClockwise size={36} weight="bold" />}
      </motion.div>

      <h2 className="mt-6 text-3xl font-bold tracking-tighter text-ink">
        {result.passed ? "Lesson cleared" : "So close"}
      </h2>
      <p className="mt-2 text-zinc-500">
        {result.passed
          ? result.leveledUp
            ? `You hit Level ${result.newLevel}.`
            : "Onward to the next one."
          : result.message ?? "Review and try again."}
      </p>

      <div className="mt-6 inline-flex items-center gap-6 rounded-2xl bg-white border border-zinc-200/70 px-6 py-4">
        <Stat label="Score" value={`${result.score}%`} />
        <div className="w-px h-8 bg-zinc-200" />
        <Stat label="XP earned" value={`+${result.xpEarned}`} accent />
        {result.passed && result.streak !== undefined && (
          <>
            <div className="w-px h-8 bg-zinc-200" />
            <Stat label="Streak" value={`${result.streak}d`} />
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {result.passed ? (
          subsequentLessonId ? (
            <Button size="lg" className="w-full" onClick={() => onContinue(`/lesson/${subsequentLessonId}`)}>
              Next lesson <ArrowRight size={18} weight="bold" />
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={() => onContinue("/dashboard")}>
              Back to dashboard
            </Button>
          )
        ) : (
          <Button size="lg" className="w-full" onClick={onRetry}>
            <ArrowsClockwise size={18} weight="bold" /> Try again
          </Button>
        )}
        <Button variant="ghost" onClick={() => onContinue("/dashboard")}>
          <House size={18} /> Dashboard
        </Button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className={`font-mono text-xl font-bold tabular-nums ${accent ? "text-accent-600" : "text-ink"}`}>
        {value}
      </p>
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}
