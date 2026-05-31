"use client";

import { useState, useEffect, useRef } from "react";
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
  Trophy,
} from "@phosphor-icons/react";
import { Button } from "../ui/Button";
import { LessonTypeBadge } from "../ui/LessonTypeBadge";
import { AchievementModal, type UnlockedAchievement } from "../ui/AchievementModal";
import { toTitleCase } from "@/lib/format";

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
  pathId,
}: {
  lesson: LessonContent;
  lessonNumber: number;
  totalLessons: number;
  subsequentLessonId: string | null;
  pathId: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"lesson" | "quiz" | "result">("lesson");
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => lesson.quiz.map(() => null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [graded, setGraded] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [achievementIndex, setAchievementIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const progressPct = Math.round((lessonNumber / totalLessons) * 100);
  const allAnswered = answers.every((a) => a !== null && a !== "");

  function selectAnswer(qIndex: number, option: string) {
    if (submitting || graded) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = option;
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const text = await res.text();
      if (!text) { setSubmitError("Server returned an empty response. Try again."); return; }
      const data = JSON.parse(text) as SubmitResult & { error?: string };
      if (!res.ok || data.error) { setSubmitError(data.error ?? `Server error ${res.status}`); return; }
      setResult(data);
      setGraded(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function showResult() {
    setPhase("result");
    const isPathComplete = !subsequentLessonId && result?.passed;
    if (isPathComplete) {
      const burst = (opts: confetti.Options) =>
        confetti({ colors: ["#fbbf24", "#f59e0b", "#fde68a", "#1c1917"], ...opts });
      setTimeout(() => burst({ particleCount: 120, spread: 100, origin: { y: 0.55 } }), 100);
      setTimeout(() => {
        burst({ particleCount: 80, spread: 130, origin: { x: 0.15, y: 0.6 } });
        burst({ particleCount: 80, spread: 130, origin: { x: 0.85, y: 0.6 } });
      }, 450);
      setTimeout(() => burst({ particleCount: 160, spread: 180, origin: { y: 0.45 } }), 850);
    } else if (result?.passed && result?.leveledUp) {
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
  }

  function retry() {
    setAnswers(lesson.quiz.map(() => null));
    setResult(null);
    setGraded(false);
    setPhase("lesson");
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Top progress bar */}
      <header className="sticky top-0 z-20 bg-canvas/85 backdrop-blur-md border-b border-zinc-200/70">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-ink transition-colors active:scale-95 shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
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
                      submitted={graded}
                      onSelect={(opt) => selectAnswer(i, opt)}
                    />
                  </motion.div>
                ))}
              </div>
              <motion.div variants={item} className="mt-8">
                {graded && result ? (
                  <Button onClick={showResult} size="lg" className="w-full">
                    {result.passed ? "See your score" : "See results"}
                    <ArrowRight size={18} weight="bold" />
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={submit}
                      size="lg"
                      className="w-full"
                      disabled={!allAnswered || submitting}
                    >
                      {submitting ? "Checking…" : "Submit answers"}
                      {!submitting && <ArrowRight size={18} weight="bold" />}
                    </Button>
                    {submitError && (
                      <p className="mt-2 text-center text-xs text-rose-500 font-mono break-all">
                        {submitError}
                      </p>
                    )}
                    {!allAnswered && !submitError && (
                      <p className="mt-2 text-center text-xs text-zinc-400">
                        Answer every question to submit
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>
          )}

          {phase === "result" && result && (
            !subsequentLessonId && result.passed ? (
              <PathCompleteView
                key="path-complete"
                result={result}
                dashboardHref={`/dashboard/${pathId}`}
                onContinue={(href) => { router.push(href); router.refresh(); }}
              />
            ) : (
              <ResultView
                key="result"
                result={result}
                subsequentLessonId={subsequentLessonId}
                dashboardHref={`/dashboard/${pathId}`}
                onRetry={retry}
                onContinue={(href) => { router.push(href); router.refresh(); }}
              />
            )
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
        {toTitleCase(lesson.headline)}
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

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function fuzzyMatch(a: string | null | undefined, b: string): boolean {
  const na = norm(a), nb = norm(b);
  if (na === nb) return true;
  if (na.length < 2 || nb.length < 2) return false;
  // Substring match (handles plurals, word extensions) with length ratio guard
  const ratio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  if (ratio >= 0.6 && (na.includes(nb) || nb.includes(na))) return true;
  // Typo tolerance: 1 char for short, 2 for longer
  return editDistance(na, nb) <= (Math.max(na.length, nb.length) <= 6 ? 1 : 2);
}

function resolveCorrect(q: QuizQuestion, opts: string[]): string {
  const direct = opts.find((o) => norm(o) === norm(q.correct));
  if (direct) return direct;
  const letterIdx = ["a", "b", "c", "d"].indexOf(norm(q.correct));
  if (letterIdx !== -1 && opts[letterIdx]) return opts[letterIdx];
  const numIdx = parseInt(q.correct, 10) - 1;
  if (!isNaN(numIdx) && opts[numIdx]) return opts[numIdx];
  // For long strings (e.g. sequence options) use edit distance to find closest option
  if (opts.length > 0 && q.correct.length > 15) {
    const nc = norm(q.correct);
    const best = opts.reduce((b, o) =>
      editDistance(norm(o), nc) < editDistance(norm(b), nc) ? o : b
    , opts[0]);
    if (editDistance(norm(best), nc) < nc.length * 0.5) return best;
  }
  return q.correct;
}

function QuizCard({
  question,
  index,
  selected,
  submitted,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selected: string | null;
  submitted: boolean;
  onSelect: (option: string) => void;
}) {
  if (question.type === "matching") {
    return (
      <MatchingCard
        question={question}
        index={index}
        selected={selected}
        submitted={submitted}
        onSelect={onSelect}
      />
    );
  }
  if (question.type === "sequence") {
    return (
      <SequenceCard
        question={question}
        index={index}
        selected={selected}
        submitted={submitted}
        onSelect={onSelect}
      />
    );
  }

  const [draft, setDraft] = useState(selected ?? "");
  const answered = selected !== null;

  const options =
    question.options?.length
      ? question.options
      : question.type === "true_false"
      ? ["True", "False"]
      : [];

  const isOpenEnded = options.length === 0;
  const correct = resolveCorrect(question, options);
  const gotItRight = isOpenEnded
    ? fuzzyMatch(selected, correct)
    : norm(selected) === norm(correct);

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 sm:p-6">
      <p className="flex gap-2 text-base font-semibold text-ink">
        <span className="font-mono text-accent-600">{index + 1}.</span>
        <span>{question.question}</span>
      </p>
      <div className="mt-4 grid gap-2.5">
        {isOpenEnded ? (
          submitted ? (
            <div className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3 ${
              gotItRight
                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                : "border-rose-400 bg-rose-50 text-rose-800"
            }`}>
              <span>{selected}</span>
              {gotItRight
                ? <Check size={16} weight="bold" className="text-emerald-600" />
                : <X size={16} weight="bold" className="text-rose-600" />}
            </div>
          ) : (
            <input
              autoFocus={index === 0}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); onSelect(e.target.value); }}
              placeholder="Type your answer…"
              className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm
                text-ink placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
          )
        ) : (
          options.map((option) => {
            const isCorrect = norm(option) === norm(correct);
            const isChosen = norm(option) === norm(selected);
            let style = "border-zinc-200 bg-white hover:border-zinc-300";
            let icon = null;
            if (isChosen && !submitted) {
              style = "border-accent-400 bg-accent-50 ring-2 ring-accent-400/30";
            } else if (submitted) {
              if (isCorrect) {
                style = "border-emerald-400 bg-emerald-50 text-emerald-800";
                icon = <Check size={16} weight="bold" className="text-emerald-600" />;
              } else if (isChosen) {
                style = "border-rose-400 bg-rose-50 text-rose-800";
                icon = <X size={16} weight="bold" className="text-rose-600" />;
              } else {
                style = "border-zinc-200 bg-white opacity-50";
              }
            }
            return (
              <motion.button
                key={option}
                onClick={() => onSelect(option)}
                disabled={submitted}
                animate={submitted && isChosen && !isCorrect ? { x: [-6, 6, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`flex items-center justify-between gap-3 text-left rounded-xl border px-4 py-3
                  text-sm transition-colors disabled:cursor-default ${style}`}
              >
                <span>{option}</span>
                {icon}
              </motion.button>
            );
          })
        )}
      </div>
      <AnimatePresence>
        {answered && submitted && (
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

// ── Matching ──────────────────────────────────────────────────────────────────
function MatchingCard({
  question, index, selected, submitted, onSelect,
}: {
  question: QuizQuestion; index: number; selected: string | null;
  submitted: boolean; onSelect: (answer: string) => void;
}) {
  const opts = Array.isArray(question.options) ? question.options.map(String) : [];

  const termMatch = String(question.question).match(/terms?[:\s]+(.+)/i);
  const extractedTerms = termMatch
    ? termMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    : [];
  const isOldFormat = extractedTerms.length > 0 && extractedTerms.length === opts.length;

  const terms = isOldFormat ? extractedTerms : opts.slice(0, Math.floor(opts.length / 2));
  const defs  = isOldFormat ? opts            : opts.slice(Math.floor(opts.length / 2));

  // pairs: { termIndex → defIndex }
  const [pairs, setPairs] = useState<Record<number, number>>(() => {
    if (!selected) return {};
    const r: Record<number, number> = {};
    selected.split(",").forEach((p) => {
      const [t, d] = p.split(":").map((s) => s.trim());
      const ti = terms.findIndex((x) => norm(x) === norm(t));
      const di = defs.findIndex((x) => norm(x) === norm(d));
      if (ti !== -1 && di !== -1) r[ti] = di;
    });
    return r;
  });
  const [activeTerm, setActiveTerm] = useState<number | null>(null);

  // SVG connector line positions
  const containerRef = useRef<HTMLDivElement>(null);
  const termRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const defRefs  = useRef<(HTMLButtonElement | null)[]>([]);
  const [pts, setPts] = useState<{ tx: number[]; ty: number[]; dx: number[]; dy: number[] }>({
    tx: [], ty: [], dx: [], dy: [],
  });

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const cr = containerRef.current.getBoundingClientRect();
      const tx: number[] = [], ty: number[] = [], dx: number[] = [], dy: number[] = [];
      termRefs.current.forEach((el) => {
        const r = el?.getBoundingClientRect();
        tx.push(r ? r.right - cr.left : 0);
        ty.push(r ? r.top + r.height / 2 - cr.top : 0);
      });
      defRefs.current.forEach((el) => {
        const r = el?.getBoundingClientRect();
        dx.push(r ? r.left - cr.left : 0);
        dy.push(r ? r.top + r.height / 2 - cr.top : 0);
      });
      setPts({ tx, ty, dx, dy });
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [terms.length, defs.length]);

  const correctPairs: Record<number, number> = isOldFormat
    ? Object.fromEntries(terms.map((_, i) => [i, i]))
    : (() => {
        const r: Record<number, number> = {};
        String(question.correct ?? "").split(",").forEach((p) => {
          const [t, d] = p.split(":").map((s) => s.trim());
          const ti = terms.findIndex((x) => norm(x) === norm(t));
          const di = defs.findIndex((x) => norm(x) === norm(d));
          if (ti !== -1 && di !== -1) r[ti] = di;
        });
        return r;
      })();

  function commit(next: Record<number, number>) {
    if (Object.keys(next).length === terms.length) {
      onSelect(Object.entries(next).map(([ti, di]) => `${terms[Number(ti)]}:${defs[Number(di)]}`).join(","));
    } else {
      onSelect("");
    }
  }

  function pickTerm(ti: number) {
    if (submitted) return;
    setActiveTerm((prev) => (prev === ti ? null : ti));
  }

  function pickDef(di: number) {
    if (submitted) return;
    const next = { ...pairs };
    if (activeTerm === null) {
      // Tap a paired def to un-pair it
      const owner = Object.entries(next).find(([, v]) => Number(v) === di);
      if (owner) { delete next[Number(owner[0])]; setPairs(next); commit(next); }
      return;
    }
    // Remove any existing owner of this def slot
    const prev = Object.entries(next).find(([, v]) => Number(v) === di);
    if (prev) delete next[Number(prev[0])];
    next[activeTerm] = di;
    setPairs(next);
    setActiveTerm(null);
    commit(next);
  }

  const allCorrect = submitted &&
    Object.entries(pairs).every(([ti, di]) => correctPairs[Number(ti)] === Number(di));

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 sm:p-6">
      <p className="flex gap-2 text-base font-semibold text-ink mb-5">
        <span className="font-mono text-accent-600">{index + 1}.</span>
        <span>{question.question}</span>
      </p>

      <div ref={containerRef} className="relative">
        {/* SVG bezier connector lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: "visible" }}
        >
          {pts.tx.length > 0 && Object.entries(pairs).map(([tiStr, di]) => {
            const ti = Number(tiStr);
            const x1 = pts.tx[ti], y1 = pts.ty[ti];
            const x2 = pts.dx[Number(di)], y2 = pts.dy[Number(di)];
            if (x1 === undefined || x2 === undefined) return null;
            const mx = (x1 + x2) / 2;
            const isCorr  = submitted && correctPairs[ti] === Number(di);
            const isWrong = submitted && !isCorr;
            return (
              <path
                key={`${ti}-${di}`}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                stroke={isCorr ? "#10b981" : isWrong ? "#f43f5e" : "#fbbf24"}
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </svg>

        <div className="grid grid-cols-2 gap-x-10">
          {/* Terms column — pink/coral */}
          <div className="flex flex-col gap-2.5">
            {terms.map((term, ti) => {
              const isActive = activeTerm === ti;
              const isPaired = pairs[ti] !== undefined;
              const isCorr  = submitted && isPaired && correctPairs[ti] === pairs[ti];
              const isWrong = submitted && isPaired && !isCorr;
              return (
                <button
                  ref={(el) => { termRefs.current[ti] = el; }}
                  key={term}
                  onClick={() => pickTerm(ti)}
                  disabled={submitted}
                  className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-sm font-medium
                    text-left transition-all active:scale-[0.98] disabled:cursor-default
                    ${isCorr  ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                    : isWrong ? "bg-rose-200 border-rose-400 text-rose-900"
                    : isActive ? "bg-accent-100 border-accent-500 ring-2 ring-accent-300/50 text-ink"
                    : "bg-rose-100 border-rose-200 text-rose-900 hover:border-rose-300"}`}
                >
                  <span className="shrink-0 w-5 h-5 rounded-lg bg-white/70 grid place-items-center
                    font-mono font-bold text-[10px] text-rose-500">
                    {String.fromCharCode(65 + ti)}
                  </span>
                  <span className="leading-snug">{term}</span>
                </button>
              );
            })}
          </div>

          {/* Defs column — mint/green */}
          <div className="flex flex-col gap-2.5">
            {defs.map((def, di) => {
              const owner = Object.entries(pairs).find(([, v]) => Number(v) === di);
              const isPaired = !!owner;
              const ti = isPaired ? Number(owner![0]) : -1;
              const isCorr  = submitted && isPaired && correctPairs[ti] === di;
              const isWrong = submitted && isPaired && !isCorr;
              const isTarget = activeTerm !== null;
              return (
                <button
                  ref={(el) => { defRefs.current[di] = el; }}
                  key={def}
                  onClick={() => pickDef(di)}
                  disabled={submitted}
                  className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-sm
                    text-left transition-all active:scale-[0.98] disabled:cursor-default
                    ${isCorr  ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                    : isWrong ? "bg-rose-200 border-rose-400 text-rose-900"
                    : isTarget ? "bg-emerald-100 border-emerald-300 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100"
                    : "bg-emerald-100 border-emerald-200 text-emerald-900"}`}
                >
                  <span className="shrink-0 w-5 h-5 rounded-lg bg-white/70 grid place-items-center
                    font-mono font-bold text-[10px] text-emerald-600">
                    {di + 1}
                  </span>
                  <span className="leading-snug">{def}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!submitted && (
        <p className="mt-3 text-xs text-zinc-400 text-center">
          {activeTerm !== null
            ? `Now tap a match for "${terms[activeTerm]}"`
            : Object.keys(pairs).length === terms.length
            ? "All matched — ready to submit"
            : "Tap a term (pink), then tap its match (green)"}
        </p>
      )}

      <AnimatePresence>
        {selected && submitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <p className={`mt-3 text-sm leading-relaxed ${allCorrect ? "text-emerald-700" : "text-zinc-600"}`}>
              <span className="font-semibold">{allCorrect ? "Correct. " : "Not quite. "}</span>
              {question.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sequence ──────────────────────────────────────────────────────────────────
function SequenceCard({
  question, index, selected, submitted, onSelect,
}: {
  question: QuizQuestion; index: number; selected: string | null;
  submitted: boolean; onSelect: (answer: string) => void;
}) {
  const opts = Array.isArray(question.options) ? question.options.map(String) : [];
  const correctStr = String(question.correct ?? "");

  // If correct has no "|", Groq generated full-sequence options — treat as pick-one
  const isSingleChoice = !correctStr.includes("|");
  const correctOption = resolveCorrect(question, opts);
  const correctOrder = correctStr.split("|").map((s) => s.trim());

  const [order, setOrder] = useState<string[]>(() =>
    selected && !isSingleChoice ? selected.split("|") : []
  );
  const remaining = opts.filter((o) => !order.includes(o));

  function pick(item: string) {
    if (submitted) return;
    if (isSingleChoice) { onSelect(item); return; }
    const next = [...order, item];
    setOrder(next);
    if (next.length === opts.length) onSelect(next.join("|"));
  }

  function unpick(item: string) {
    if (submitted || isSingleChoice) return;
    setOrder((prev) => prev.filter((o) => o !== item));
    onSelect("");
  }

  const isCorrect = isSingleChoice
    ? norm(selected) === norm(correctOption)
    : order.length === correctOrder.length && order.every((o, i) => norm(o) === norm(correctOrder[i]));

  // ── Single-choice mode (pick the correct sequence from options) ──
  if (isSingleChoice) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 sm:p-6">
        <p className="flex gap-2 text-base font-semibold text-ink mb-4">
          <span className="font-mono text-accent-600">{index + 1}.</span>
          <span>{question.question}</span>
        </p>
        <div className="grid gap-2.5">
          {opts.map((option) => {
            const isCorrectOpt = norm(option) === norm(correctOption);
            const isChosen = norm(option) === norm(selected ?? "");
            let style = "border-zinc-200 bg-white hover:border-zinc-300";
            let icon = null;
            if (isChosen && !submitted) {
              style = "border-accent-400 bg-accent-50 ring-2 ring-accent-400/30";
            } else if (submitted) {
              if (isCorrectOpt) {
                style = "border-emerald-400 bg-emerald-50 text-emerald-800";
                icon = <Check size={16} weight="bold" className="text-emerald-600" />;
              } else if (isChosen) {
                style = "border-rose-400 bg-rose-50 text-rose-800";
                icon = <X size={16} weight="bold" className="text-rose-600" />;
              } else {
                style = "border-zinc-200 bg-white opacity-50";
              }
            }
            return (
              <motion.button
                key={option}
                onClick={() => pick(option)}
                disabled={submitted}
                animate={submitted && isChosen && !isCorrectOpt ? { x: [-6, 6, -5, 5, 0] } : {}}
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
          {selected && submitted && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <p className={`mt-3 text-sm leading-relaxed ${isCorrect ? "text-emerald-700" : "text-zinc-600"}`}>
                <span className="font-semibold">{isCorrect ? "Correct. " : "Not quite. "}</span>
                {question.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Step-ordering mode (drag items into the correct order) ──
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 sm:p-6">
      <p className="flex gap-2 text-base font-semibold text-ink mb-4">
        <span className="font-mono text-accent-600">{index + 1}.</span>
        <span>{question.question}</span>
      </p>

      {order.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Your order</p>
          {order.map((item, i) => {
            const correct = submitted && norm(item) === norm(correctOrder[i]);
            const wrong   = submitted && norm(item) !== norm(correctOrder[i]);
            return (
              <div key={item} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm
                ${correct ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : wrong ? "border-rose-400 bg-rose-50 text-rose-800"
                  : "border-accent-200 bg-accent-50"}`}
              >
                <span className="font-mono text-xs font-bold text-accent-600 shrink-0">{i + 1}</span>
                <span className="flex-1">{item}</span>
                {!submitted && (
                  <button onClick={() => unpick(item)} className="text-zinc-400 hover:text-zinc-600">
                    <X size={14} weight="bold" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!submitted && remaining.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {order.length === 0 ? "Click items in the correct order" : "Remaining"}
          </p>
          {remaining.map((item) => (
            <button
              key={item}
              onClick={() => pick(item)}
              className="text-left rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm
                hover:border-zinc-300 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && submitted && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <p className={`mt-3 text-sm leading-relaxed ${isCorrect ? "text-emerald-700" : "text-zinc-600"}`}>
              <span className="font-semibold">{isCorrect ? "Correct. " : "Not quite. "}</span>
              {question.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PathCompleteView({
  result,
  dashboardHref,
  onContinue,
}: {
  result: SubmitResult;
  dashboardHref: string;
  onContinue: (href: string) => void;
}) {
  return (
    <motion.div
      key="path-complete"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 18 }}
      className="text-center pt-4"
    >
      {/* Trophy icon */}
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.08 }}
        className="mx-auto w-24 h-24 rounded-[2rem] bg-accent-400
          shadow-[0_8px_0_var(--color-accent-600)]
          grid place-items-center mb-6"
      >
        <Trophy size={48} weight="fill" className="text-ink" />
      </motion.div>

      {/* Label */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xs font-bold uppercase tracking-widest text-accent-600 mb-2"
      >
        Path complete
      </motion.p>

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl sm:text-5xl font-bold tracking-tighter text-ink leading-none"
      >
        You did it.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.42 }}
        className="mt-3 text-base text-zinc-500 max-w-[34ch] mx-auto leading-relaxed"
      >
        Every lesson cleared. Every concept earned.
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.52, type: "spring", stiffness: 120, damping: 18 }}
        className="mt-8 inline-flex items-center gap-5 rounded-2xl bg-white
          border border-zinc-200/70 px-6 py-4
          shadow-[0_4px_0_#e4e4e7]"
      >
        <Stat label="Score" value={`${result.score}%`} />
        <div className="w-px h-8 bg-zinc-200" />
        <Stat label="XP earned" value={`+${result.xpEarned}`} accent />
        {result.streak !== undefined && (
          <>
            <div className="w-px h-8 bg-zinc-200" />
            <Stat label="Streak" value={`${result.streak}d`} />
          </>
        )}
        {result.newLevel && (
          <>
            <div className="w-px h-8 bg-zinc-200" />
            <Stat label="Level" value={`${result.newLevel}`} />
          </>
        )}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mt-8"
      >
        <Button size="lg" className="w-full" onClick={() => onContinue(dashboardHref)}>
          Back to dashboard <ArrowRight size={18} weight="bold" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

function ResultView({
  result,
  subsequentLessonId,
  dashboardHref,
  onRetry,
  onContinue,
}: {
  result: SubmitResult;
  subsequentLessonId: string | null;
  dashboardHref: string;
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
            <Button size="lg" className="w-full" onClick={() => onContinue(dashboardHref)}>
              Back to dashboard
            </Button>
          )
        ) : (
          <Button size="lg" className="w-full" onClick={onRetry}>
            <ArrowsClockwise size={18} weight="bold" /> Try again
          </Button>
        )}
        <Button variant="ghost" onClick={() => onContinue(dashboardHref)}>
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
