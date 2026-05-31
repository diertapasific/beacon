"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowRight, ArrowLeft, Check, X, Lightbulb, Sparkle, House, ArrowsClockwise, Trophy,
} from "@phosphor-icons/react";
import { lessonTypeLabel } from "../ui/LessonTypeBadge";
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

const CONFETTI_COLORS = ["#ff9600", "#1cb0f6", "#ffc800", "#ff4b4b"];

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 18 } },
};

// Riso primary / ghost buttons used throughout the focused reader.
function PrimaryButton({ className = "", children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl h-14 px-6 text-base font-extrabold uppercase tracking-wide
        bg-clay text-cream border-2 border-transparent shadow-hard-clay press-clay
        disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function GhostButton({ className = "", children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl h-11 px-5 text-sm font-bold
        text-ink-soft border-2 border-transparent hover:text-ink hover:bg-paper-2 active:scale-[0.98] transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Correct / wrong inline markers (filled riso circles).
function Mark({ ok }: { ok: boolean }) {
  return (
    <span className={`grid place-items-center w-5 h-5 rounded-full text-cream border-2 border-line shrink-0 ${ok ? "bg-teal" : "bg-berry"}`}>
      {ok ? <Check size={11} weight="bold" /> : <X size={11} weight="bold" />}
    </span>
  );
}

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
  const [answers, setAnswers] = useState<(string | null)[]>(() => lesson.quiz.map(() => null));
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
      const burst = (opts: confetti.Options) => confetti({ colors: CONFETTI_COLORS, ...opts });
      setTimeout(() => burst({ particleCount: 120, spread: 100, origin: { y: 0.55 } }), 100);
      setTimeout(() => {
        burst({ particleCount: 80, spread: 130, origin: { x: 0.15, y: 0.6 } });
        burst({ particleCount: 80, spread: 130, origin: { x: 0.85, y: 0.6 } });
      }, 450);
      setTimeout(() => burst({ particleCount: 160, spread: 180, origin: { y: 0.45 } }), 850);
    } else if (result?.passed && result?.leveledUp) {
      setTimeout(() => confetti({ particleCount: 160, spread: 100, origin: { y: 0.5 }, colors: CONFETTI_COLORS }), 250);
    }
  }

  function retry() {
    setAnswers(lesson.quiz.map(() => null));
    setResult(null);
    setGraded(false);
    setPhase("lesson");
  }

  return (
    <div className="bg-paper min-h-[100dvh] flex flex-col">
      {/* Top progress bar */}
      <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur-md border-b-2 border-line">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-ink-soft hover:text-ink transition-colors active:scale-95 shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
          <div className="flex-1 h-3 rounded-full bg-cream border-2 border-line overflow-hidden">
            <motion.div
              className="h-full bg-clay"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-ink-soft tabular-nums shrink-0">
            {lessonNumber}/{totalLessons}
          </span>
        </div>
      </header>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {phase === "lesson" && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
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
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.div variants={item} className="mb-6">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep">/ Quick check</p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">Prove it stuck</h2>
              </motion.div>
              <div className="flex flex-col gap-4">
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
              <motion.div variants={item} className="mt-7">
                {graded && result ? (
                  <PrimaryButton onClick={showResult} className="w-full">
                    {result.passed ? "See your score" : "See results"}
                    <ArrowRight size={18} weight="bold" />
                  </PrimaryButton>
                ) : (
                  <>
                    <PrimaryButton onClick={submit} className="w-full" disabled={!allAnswered || submitting}>
                      {submitting ? "Checking…" : "Submit answers"}
                      {!submitting && <ArrowRight size={18} weight="bold" />}
                    </PrimaryButton>
                    {submitError && (
                      <p className="mt-2 text-center font-mono text-xs font-bold text-berry break-all">{submitError}</p>
                    )}
                    {!allAnswered && !submitError && (
                      <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-wide text-ink-faint">Answer every question to submit</p>
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
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-sun-tint text-ink px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide">
        {lessonTypeLabel(lesson.type)}
      </span>
      <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.02] text-ink">
        {toTitleCase(lesson.headline)}
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-ink-soft max-w-[60ch]">{lesson.coreIdea}</p>

      <div className="mt-8 rounded-xl border-2 border-line bg-paper-2 p-5 overflow-x-auto shadow-hard-sm">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint mb-2">Example</p>
        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-ink">{lesson.example}</pre>
      </div>

      <div className="mt-4 rounded-xl border-2 border-line bg-teal-tint p-5 shadow-hard-sm">
        <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wide text-teal-deep mb-2">
          <Sparkle size={14} weight="fill" /> In the wild
        </p>
        <p className="text-sm leading-relaxed text-ink">{lesson.realWorldUse}</p>
      </div>

      <PrimaryButton onClick={onReady} className="w-full mt-8">
        <Lightbulb size={18} weight="fill" /> I&rsquo;m ready — take the quiz
      </PrimaryButton>
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
  const ratio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  if (ratio >= 0.6 && (na.includes(nb) || nb.includes(na))) return true;
  return editDistance(na, nb) <= (Math.max(na.length, nb.length) <= 6 ? 1 : 2);
}

function resolveCorrect(q: QuizQuestion, opts: string[]): string {
  const direct = opts.find((o) => norm(o) === norm(q.correct));
  if (direct) return direct;
  const letterIdx = ["a", "b", "c", "d"].indexOf(norm(q.correct));
  if (letterIdx !== -1 && opts[letterIdx]) return opts[letterIdx];
  const numIdx = parseInt(q.correct, 10) - 1;
  if (!isNaN(numIdx) && opts[numIdx]) return opts[numIdx];
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
  question, index, selected, submitted, onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selected: string | null;
  submitted: boolean;
  onSelect: (option: string) => void;
}) {
  const [draft, setDraft] = useState(selected ?? "");

  if (question.type === "matching") {
    return <MatchingCard question={question} index={index} selected={selected} submitted={submitted} onSelect={onSelect} />;
  }
  if (question.type === "sequence") {
    return <SequenceCard question={question} index={index} selected={selected} submitted={submitted} onSelect={onSelect} />;
  }

  const answered = selected !== null;

  const options =
    question.options?.length
      ? question.options
      : question.type === "true_false"
      ? ["True", "False"]
      : [];

  const isOpenEnded = options.length === 0;
  const correct = resolveCorrect(question, options);
  const gotItRight = isOpenEnded ? fuzzyMatch(selected, correct) : norm(selected) === norm(correct);

  return (
    <div className="rounded-xl border-2 border-line bg-cream p-5 sm:p-6 shadow-hard">
      <p className="flex gap-2 text-base font-bold text-ink">
        <span className="font-mono text-clay-deep">{index + 1}.</span>
        <span>{question.question}</span>
      </p>
      <div className="mt-4 grid gap-2.5">
        {isOpenEnded ? (
          submitted ? (
            <div className={`rounded-lg border-2 border-line px-4 py-3 text-sm font-medium flex items-center justify-between gap-3 ${
              gotItRight ? "bg-teal-tint text-teal-deep" : "bg-berry-tint text-berry"
            }`}>
              <span>{selected}</span>
              <Mark ok={gotItRight} />
            </div>
          ) : (
            <input
              autoFocus={index === 0}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); onSelect(e.target.value); }}
              placeholder="Type your answer…"
              className="w-full h-12 rounded-lg border-2 border-line bg-paper px-4 text-sm text-ink
                placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-clay"
            />
          )
        ) : (
          options.map((option) => {
            const isCorrect = norm(option) === norm(correct);
            const isChosen = norm(option) === norm(selected);
            let style = "border-ink/25 bg-paper hover:border-line text-ink-soft";
            let icon = null;
            if (isChosen && !submitted) {
              style = "border-line bg-clay-tint text-ink shadow-hard-sm";
            } else if (submitted) {
              if (isCorrect) {
                style = "border-line bg-teal-tint text-teal-deep";
                icon = <Mark ok />;
              } else if (isChosen) {
                style = "border-line bg-berry-tint text-berry";
                icon = <Mark ok={false} />;
              } else {
                style = "border-ink/20 bg-paper text-ink-faint opacity-60";
              }
            }
            return (
              <motion.button
                key={option}
                onClick={() => onSelect(option)}
                disabled={submitted}
                animate={submitted && isChosen && !isCorrect ? { x: [-6, 6, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`flex items-center justify-between gap-3 text-left rounded-lg border-2 px-4 py-3
                  text-sm font-medium transition-colors disabled:cursor-default ${style}`}
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
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <p className={`mt-3 text-sm leading-relaxed ${gotItRight ? "text-teal-deep" : "text-ink-soft"}`}>
              <span className="font-bold">{gotItRight ? "Correct. " : "Not quite. "}</span>
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
  const extractedTerms = termMatch ? termMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];
  const isOldFormat = extractedTerms.length > 0 && extractedTerms.length === opts.length;

  const terms = isOldFormat ? extractedTerms : opts.slice(0, Math.floor(opts.length / 2));
  const defs  = isOldFormat ? opts            : opts.slice(Math.floor(opts.length / 2));

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

  const containerRef = useRef<HTMLDivElement>(null);
  const termRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const defRefs  = useRef<(HTMLButtonElement | null)[]>([]);
  const [pts, setPts] = useState<{ tx: number[]; ty: number[]; dx: number[]; dy: number[] }>({ tx: [], ty: [], dx: [], dy: [] });

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
      const owner = Object.entries(next).find(([, v]) => Number(v) === di);
      if (owner) { delete next[Number(owner[0])]; setPairs(next); commit(next); }
      return;
    }
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
    <div className="rounded-xl border-2 border-line bg-cream p-5 sm:p-6 shadow-hard">
      <p className="flex gap-2 text-base font-bold text-ink mb-5">
        <span className="font-mono text-clay-deep">{index + 1}.</span>
        <span>{question.question}</span>
      </p>

      <div ref={containerRef} className="relative">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
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
                stroke={isCorr ? "#1cb0f6" : isWrong ? "#ff4b4b" : "#ff9600"}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </svg>

        <div className="grid grid-cols-2 gap-x-10">
          {/* Terms column */}
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
                  className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-sm font-medium
                    text-left transition-all active:scale-[0.98] disabled:cursor-default
                    ${isCorr  ? "bg-teal-tint border-line text-teal-deep"
                    : isWrong ? "bg-berry-tint border-line text-berry"
                    : isActive ? "bg-clay-tint border-line text-ink shadow-hard-sm"
                    : "bg-paper border-ink/25 text-ink-soft hover:border-line"}`}
                >
                  <span className="shrink-0 w-5 h-5 rounded bg-sun-tint border-2 border-line grid place-items-center font-mono font-bold text-[10px] text-ink">
                    {String.fromCharCode(65 + ti)}
                  </span>
                  <span className="leading-snug">{term}</span>
                </button>
              );
            })}
          </div>

          {/* Defs column */}
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
                  className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-sm
                    text-left transition-all active:scale-[0.98] disabled:cursor-default
                    ${isCorr  ? "bg-teal-tint border-line text-teal-deep"
                    : isWrong ? "bg-berry-tint border-line text-berry"
                    : isTarget ? "bg-paper border-clay text-ink hover:border-line"
                    : "bg-paper border-ink/25 text-ink-soft"}`}
                >
                  <span className="shrink-0 w-5 h-5 rounded bg-sun-tint border-2 border-line grid place-items-center font-mono font-bold text-[10px] text-ink">
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
        <p className="mt-3 font-mono text-[11px] text-ink-faint text-center">
          {activeTerm !== null
            ? `Now tap a match for "${terms[activeTerm]}"`
            : Object.keys(pairs).length === terms.length
            ? "All matched — ready to submit"
            : "Tap a term, then tap its match"}
        </p>
      )}

      <AnimatePresence>
        {selected && submitted && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <p className={`mt-3 text-sm leading-relaxed ${allCorrect ? "text-teal-deep" : "text-ink-soft"}`}>
              <span className="font-bold">{allCorrect ? "Correct. " : "Not quite. "}</span>
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

  const isSingleChoice = !correctStr.includes("|");
  const correctOption = resolveCorrect(question, opts);
  const correctOrder = correctStr.split("|").map((s) => s.trim());

  const [order, setOrder] = useState<string[]>(() => (selected && !isSingleChoice ? selected.split("|") : []));
  const remaining = opts.filter((o) => !order.includes(o));

  function pick(it: string) {
    if (submitted) return;
    if (isSingleChoice) { onSelect(it); return; }
    const next = [...order, it];
    setOrder(next);
    if (next.length === opts.length) onSelect(next.join("|"));
  }

  function unpick(it: string) {
    if (submitted || isSingleChoice) return;
    setOrder((prev) => prev.filter((o) => o !== it));
    onSelect("");
  }

  const isCorrect = isSingleChoice
    ? norm(selected) === norm(correctOption)
    : order.length === correctOrder.length && order.every((o, i) => norm(o) === norm(correctOrder[i]));

  if (isSingleChoice) {
    return (
      <div className="rounded-xl border-2 border-line bg-cream p-5 sm:p-6 shadow-hard">
        <p className="flex gap-2 text-base font-bold text-ink mb-4">
          <span className="font-mono text-clay-deep">{index + 1}.</span>
          <span>{question.question}</span>
        </p>
        <div className="grid gap-2.5">
          {opts.map((option) => {
            const isCorrectOpt = norm(option) === norm(correctOption);
            const isChosen = norm(option) === norm(selected ?? "");
            let style = "border-ink/25 bg-paper hover:border-line text-ink-soft";
            let icon = null;
            if (isChosen && !submitted) {
              style = "border-line bg-clay-tint text-ink shadow-hard-sm";
            } else if (submitted) {
              if (isCorrectOpt) {
                style = "border-line bg-teal-tint text-teal-deep";
                icon = <Mark ok />;
              } else if (isChosen) {
                style = "border-line bg-berry-tint text-berry";
                icon = <Mark ok={false} />;
              } else {
                style = "border-ink/20 bg-paper text-ink-faint opacity-60";
              }
            }
            return (
              <motion.button
                key={option}
                onClick={() => pick(option)}
                disabled={submitted}
                animate={submitted && isChosen && !isCorrectOpt ? { x: [-6, 6, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`flex items-center justify-between gap-3 text-left rounded-lg border-2 px-4 py-3
                  text-sm font-medium transition-colors disabled:cursor-default ${style}`}
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
              <p className={`mt-3 text-sm leading-relaxed ${isCorrect ? "text-teal-deep" : "text-ink-soft"}`}>
                <span className="font-bold">{isCorrect ? "Correct. " : "Not quite. "}</span>
                {question.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-line bg-cream p-5 sm:p-6 shadow-hard">
      <p className="flex gap-2 text-base font-bold text-ink mb-4">
        <span className="font-mono text-clay-deep">{index + 1}.</span>
        <span>{question.question}</span>
      </p>

      {order.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink-faint">Your order</p>
          {order.map((it, i) => {
            const correct = submitted && norm(it) === norm(correctOrder[i]);
            const wrong   = submitted && norm(it) !== norm(correctOrder[i]);
            return (
              <div key={it} className={`flex items-center gap-3 rounded-lg border-2 border-line px-3 py-2.5 text-sm font-medium
                ${correct ? "bg-teal-tint text-teal-deep"
                  : wrong ? "bg-berry-tint text-berry"
                  : "bg-clay-tint text-ink"}`}
              >
                <span className="font-mono text-xs font-bold text-clay-deep shrink-0">{i + 1}</span>
                <span className="flex-1">{it}</span>
                {!submitted && (
                  <button onClick={() => unpick(it)} className="text-ink-soft hover:text-ink">
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
          <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink-faint">
            {order.length === 0 ? "Tap items in the correct order" : "Remaining"}
          </p>
          {remaining.map((it) => (
            <button
              key={it}
              onClick={() => pick(it)}
              className="text-left rounded-lg border-2 border-ink/25 bg-paper px-3 py-2.5 text-sm font-medium text-ink-soft
                hover:border-line transition-colors"
            >
              {it}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && submitted && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <p className={`mt-3 text-sm leading-relaxed ${isCorrect ? "text-teal-deep" : "text-ink-soft"}`}>
              <span className="font-bold">{isCorrect ? "Correct. " : "Not quite. "}</span>
              {question.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PathCompleteView({
  result, dashboardHref, onContinue,
}: {
  result: SubmitResult;
  dashboardHref: string;
  onContinue: (href: string) => void;
}) {
  return (
    <motion.div
      key="path-complete"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 18 }}
      className="text-center pt-4"
    >
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: -4 }}
        transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.08 }}
        className="mx-auto w-20 h-20 rounded-2xl bg-clay text-cream border-2 border-line shadow-hard-lg grid place-items-center mb-6"
      >
        <Trophy size={40} weight="fill" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-clay-deep mb-3"
      >
        Path complete
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-none"
      >
        You did it.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
        className="mt-3 text-base text-ink-soft max-w-[34ch] mx-auto leading-relaxed"
      >
        Every lesson cleared. Every concept earned.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.52, type: "spring", stiffness: 120, damping: 18 }}
        className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-3 rounded-xl border-2 border-line bg-cream px-6 py-4 shadow-hard"
      >
        <Stat label="Score" value={`${result.score}%`} />
        <span className="w-0.5 h-8 bg-ink/20" />
        <Stat label="XP earned" value={`+${result.xpEarned}`} accent />
        {result.streak !== undefined && (
          <>
            <span className="w-0.5 h-8 bg-ink/20" />
            <Stat label="Streak" value={`${result.streak}d`} />
          </>
        )}
        {result.newLevel && (
          <>
            <span className="w-0.5 h-8 bg-ink/20" />
            <Stat label="Level" value={`${result.newLevel}`} />
          </>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mt-8">
        <PrimaryButton className="w-full" onClick={() => onContinue(dashboardHref)}>
          Back to dashboard <ArrowRight size={18} weight="bold" />
        </PrimaryButton>
      </motion.div>
    </motion.div>
  );
}

function ResultView({
  result, subsequentLessonId, dashboardHref, onRetry, onContinue,
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="text-center pt-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.05 }}
        className={`mx-auto grid place-items-center w-20 h-20 rounded-2xl border-2 border-line shadow-hard ${
          result.passed ? "bg-teal text-cream" : "bg-berry text-cream"
        }`}
      >
        {result.passed ? <Check size={40} weight="bold" /> : <ArrowsClockwise size={36} weight="bold" />}
      </motion.div>

      <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">
        {result.passed ? "Lesson cleared" : "So close"}
      </h2>
      <p className="mt-2 text-ink-soft">
        {result.passed
          ? result.leveledUp ? `You hit Level ${result.newLevel}.` : "Onward to the next one."
          : result.message ?? "Review and try again."}
      </p>

      <div className="mt-6 flex flex-wrap justify-center items-center gap-x-6 gap-y-3 rounded-xl border-2 border-line bg-cream px-6 py-4 shadow-hard">
        <Stat label="Score" value={`${result.score}%`} />
        <span className="w-0.5 h-8 bg-ink/20" />
        <Stat label="XP earned" value={`+${result.xpEarned}`} accent />
        {result.passed && result.streak !== undefined && (
          <>
            <span className="w-0.5 h-8 bg-ink/20" />
            <Stat label="Streak" value={`${result.streak}d`} />
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 items-stretch">
        {result.passed ? (
          subsequentLessonId ? (
            <PrimaryButton className="w-full" onClick={() => onContinue(`/lesson/${subsequentLessonId}`)}>
              Next lesson <ArrowRight size={18} weight="bold" />
            </PrimaryButton>
          ) : (
            <PrimaryButton className="w-full" onClick={() => onContinue(dashboardHref)}>
              Back to dashboard
            </PrimaryButton>
          )
        ) : (
          <PrimaryButton className="w-full" onClick={onRetry}>
            <ArrowsClockwise size={18} weight="bold" /> Try again
          </PrimaryButton>
        )}
        <GhostButton onClick={() => onContinue(dashboardHref)}>
          <House size={18} weight="bold" /> Dashboard
        </GhostButton>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className={`font-mono text-xl font-bold tabular-nums ${accent ? "text-clay-deep" : "text-ink"}`}>{value}</p>
      <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
