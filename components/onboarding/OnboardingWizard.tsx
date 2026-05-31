"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lighthouse, ArrowRight, ArrowLeft, Check } from "@phosphor-icons/react";
import { Button } from "../ui/Button";

const SKILL_SUGGESTIONS = [
  "Machine Learning",
  "Grant Writing",
  "Woodworking",
  "Music Theory",
  "Negotiation",
  "Watercolour Painting",
];

const LEVELS = [
  { value: "beginner", label: "Beginner", desc: "New to this. Start from the ground up." },
  { value: "intermediate", label: "Intermediate", desc: "I know the basics, push me further." },
  { value: "advanced", label: "Advanced", desc: "Sharpen the edges and fill the gaps." },
];

const PACES = [
  { hours: 2, label: "Casual", desc: "1–2 hrs / week" },
  { hours: 4, label: "Steady", desc: "3–5 hrs / week" },
  { hours: 8, label: "Serious", desc: "6–10 hrs / week" },
  { hours: 12, label: "Intense", desc: "10+ hrs / week" },
];

const GENERATING_MESSAGES = [
  "Mapping the fundamentals…",
  "Sequencing four weeks of lessons…",
  "Writing bite-sized concepts…",
  "Crafting quizzes…",
  "Polishing your path…",
];

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [skill, setSkill] = useState("");
  const [level, setLevel] = useState("");
  const [hours, setHours] = useState<number | null>(null);
  const [goal, setGoal] = useState("");
  const [phase, setPhase] = useState<"form" | "generating" | "error">("form");
  const [error, setError] = useState<string | null>(null);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const canAdvance = [skill.trim().length > 1, !!level, !!hours][step];

  async function generate() {
    setPhase("generating");
    setError(null);
    try {
      const res = await fetch("/api/paths/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: skill.trim(), level, hoursPerWeek: hours, goal: goal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "We couldn't build your path. Try again.");
        setPhase("error");
        return;
      }
      router.push(`/dashboard/${data.pathId}`);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setPhase("error");
    }
  }

  if (phase === "generating") return <GeneratingScreen skill={skill} />;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="px-4 sm:px-6 py-5 max-w-2xl w-full mx-auto flex items-center gap-2">
        <span className="grid place-items-center w-8 h-8 rounded-xl bg-ink text-accent-400">
          <Lighthouse size={18} weight="fill" />
        </span>
        <span className="text-lg font-semibold tracking-tight text-ink">Beacon</span>
      </header>

      {/* Step progress */}
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-zinc-200 overflow-hidden">
              <motion.div
                className="h-full bg-accent-400"
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 grid place-items-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-2xl">
          <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 && (
                <Step
                  eyebrow="Step 1 of 3"
                  title="What do you want to learn?"
                  desc="Any skill at all. The more specific, the sharper your path."
                >
                  <input
                    autoFocus
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canAdvance && go(1)}
                    placeholder="e.g. Machine Learning"
                    className="w-full h-14 rounded-2xl border border-zinc-200 bg-white px-5 text-lg
                      text-ink placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {SKILL_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSkill(s)}
                        className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm
                          text-zinc-600 hover:border-accent-300 hover:text-ink transition-colors active:scale-95"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Step>
              )}

              {step === 1 && (
                <Step
                  eyebrow="Step 2 of 3"
                  title="Where are you starting from?"
                  desc="We'll calibrate the depth and pace to match."
                >
                  <div className="grid gap-3">
                    {LEVELS.map((l) => (
                      <SelectCard
                        key={l.value}
                        selected={level === l.value}
                        onClick={() => setLevel(l.value)}
                        title={l.label}
                        desc={l.desc}
                      />
                    ))}
                  </div>
                </Step>
              )}

              {step === 2 && (
                <Step
                  eyebrow="Step 3 of 3"
                  title="How much time can you give?"
                  desc="Be honest — small and steady wins. You can change this later."
                >
                  <div className="grid grid-cols-2 gap-3">
                    {PACES.map((p) => (
                      <SelectCard
                        key={p.hours}
                        selected={hours === p.hours}
                        onClick={() => setHours(p.hours)}
                        title={p.label}
                        desc={p.desc}
                      />
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-2">
                    <label htmlFor="goal" className="text-sm font-medium text-ink">
                      Anything specific you’re aiming for?{" "}
                      <span className="text-xs font-normal text-zinc-400">optional</span>
                    </label>
                    <textarea
                      id="goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      rows={2}
                      placeholder="e.g. Ship a side project, pass an exam, switch careers…"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-ink
                        placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-accent-400"
                    />
                  </div>
                </Step>
              )}
            </motion.div>
          </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => go(step - 1)}>
                <ArrowLeft size={18} weight="bold" /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <Button onClick={() => go(step + 1)} disabled={!canAdvance}>
                Continue <ArrowRight size={18} weight="bold" />
              </Button>
            ) : (
              <Button onClick={generate} disabled={!canAdvance} size="lg">
                Build my path <ArrowRight size={18} weight="bold" />
              </Button>
            )}
          </div>

          {phase === "error" && error && (
            <p className="mt-4 text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">{eyebrow}</p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter text-ink leading-none">
        {title}
      </h1>
      <p className="mt-3 text-zinc-500 leading-relaxed max-w-[55ch]">{desc}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function SelectCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border p-4 transition-all active:scale-[0.99] ${
        selected
          ? "border-accent-400 bg-accent-50 ring-2 ring-accent-400/40"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink">{title}</span>
        {selected && (
          <span className="grid place-items-center w-5 h-5 rounded-full bg-accent-500 text-white">
            <Check size={12} weight="bold" />
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-500">{desc}</p>
    </button>
  );
}

function GeneratingScreen({ skill }: { skill: string }) {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % GENERATING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-[100dvh] grid place-items-center px-6 text-center">
      <div>
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto grid place-items-center w-20 h-20 rounded-3xl bg-ink text-accent-400"
        >
          <Lighthouse size={40} weight="fill" />
        </motion.div>
        <h1 className="mt-8 text-2xl sm:text-3xl font-bold tracking-tighter text-ink">
          Building your path for{" "}
          <span className="text-accent-600">{skill}</span>
        </h1>
        <div className="mt-4 h-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-zinc-500"
            >
              {GENERATING_MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="mt-8 text-xs text-zinc-400 font-mono">This usually takes 10–20 seconds</p>
      </div>
    </div>
  );
}
