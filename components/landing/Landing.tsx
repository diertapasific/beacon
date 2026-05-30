"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Lighthouse,
  MagicWand,
  Flame,
  Clock,
  Brain,
  ChartLineUp,
  ArrowRight,
  Check,
  Sparkle,
} from "@phosphor-icons/react";
import { Button } from "../ui/Button";
import { MagneticButton } from "../ui/MagneticButton";
import { Logo } from "../ui/Logo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 90, damping: 18 } },
};

export function Landing() {
  const router = useRouter();
  return (
    <div className="overflow-x-hidden">
      <SiteHeader />
      <Hero onStart={() => router.push("/auth/signup")} />
      <Explainer />
      <Features />
      <HowItWorks />
      <SocialProof />
      <FooterCTA onStart={() => router.push("/auth/signup")} />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-canvas/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-zinc-600 hover:text-ink transition-colors px-3 py-2"
          >
            Log in
          </Link>
          <Link href="/auth/signup">
            <Button size="md">Get started</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
        {/* Left — content (asymmetric, left-aligned) */}
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600"
          >
            <Sparkle size={14} weight="fill" className="text-accent-500" />
            AI-built paths for any skill
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="mt-6 text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tighter leading-[0.95] text-ink"
          >
            Learn anything,
            <br />
            <span className="text-accent-500">90 seconds</span> a day.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg text-zinc-600 leading-relaxed max-w-[52ch]"
          >
            Name a skill. Beacon writes you a four-week path, then drips it out as
            bite-sized lessons with quizzes, streaks, and XP that pull you back tomorrow.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
            <MagneticButton onClick={onStart}>
              Start learning free <ArrowRight size={18} weight="bold" />
            </MagneticButton>
            <Link href="#how">
              <Button variant="secondary" size="lg">
                How it works
              </Button>
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-5 text-sm text-zinc-400">
            No card required. Pick a skill and start in 30 seconds.
          </motion.p>
        </motion.div>

        {/* Right — product peek */}
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="relative"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-[2rem] bg-ink text-canvas p-7 shadow-[0_40px_80px_-30px_rgba(28,25,23,0.5)]"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-accent-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <Brain size={14} weight="bold" /> Concept
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
            <Clock size={14} /> 90s
          </span>
        </div>
        <h3 className="mt-4 text-2xl font-bold tracking-tighter leading-tight">
          Gradient descent walks downhill
        </h3>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Picture a ball on a hilly surface. Each step it rolls toward the steepest
          drop — that’s the model nudging its weights to shrink error.
        </p>
        <div className="mt-5 flex items-center gap-1.5">
          <Flame size={18} weight="fill" className="text-accent-400" />
          <span className="font-mono text-sm">11</span>
          <span className="text-xs text-zinc-500">day streak</span>
          <span className="ml-auto font-mono text-sm text-accent-300">+50 XP</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-6 -left-4 sm:-left-8 rounded-2xl bg-white border border-zinc-200 p-4 shadow-xl w-44"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Level 7</p>
        <div className="mt-2 h-2 rounded-full bg-zinc-200 overflow-hidden">
          <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-accent-400 to-accent-500" />
        </div>
        <p className="mt-1.5 text-xs text-zinc-400 font-mono">320 XP to L8</p>
      </motion.div>
    </motion.div>
  );
}

function Explainer() {
  return (
    <section className="border-y border-zinc-200/60 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="text-3xl sm:text-4xl font-bold tracking-tighter text-ink leading-none"
        >
          Courses are too big.
          <br />
          Beacon is the opposite.
        </motion.h2>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="text-lg text-zinc-600 leading-relaxed max-w-[60ch]"
        >
          <p>
            Most learning fails because it asks for an hour you don’t have. Beacon asks for
            ninety seconds. One idea, one example, one quick check — then you’re done for the
            day, streak intact.
          </p>
          <p className="mt-4">
            Do two and the next earns bonus XP. Skip a day and you only lose the streak, never
            the progress. Small enough to actually keep.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: MagicWand,
    title: "Any skill, mapped in seconds",
    desc: "Type 'fermentation' or 'options trading' — Beacon designs a coherent four-week curriculum, sequenced from first principles.",
    wide: true,
  },
  {
    icon: Clock,
    title: "90-second lessons",
    desc: "One concept at a time. Read it on a coffee break.",
    wide: false,
  },
  {
    icon: Flame,
    title: "Streaks that stick",
    desc: "Daily momentum, milestone rewards, gentle nudges.",
    wide: false,
  },
  {
    icon: ChartLineUp,
    title: "XP, levels, and badges",
    desc: "Every correct answer and finished lesson moves a bar. Fifty levels, eleven badges, one very satisfying climb.",
    wide: true,
  },
];

function Features() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="max-w-2xl"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">Why it works</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter text-ink leading-none">
          Built to be impossible to quit
        </h2>
      </motion.div>

      {/* Asymmetric bento — not a row of equal cards */}
      <div className="mt-10 grid md:grid-cols-3 gap-4 sm:gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className={`rounded-[2rem] border border-zinc-200/70 bg-white p-7 sm:p-8
              shadow-[0_20px_40px_-25px_rgba(0,0,0,0.12)] ${f.wide ? "md:col-span-2" : ""}`}
          >
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-accent-50 text-accent-600 mb-5">
              <f.icon size={24} weight="bold" />
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-ink">{f.title}</h3>
            <p className="mt-2 text-zinc-600 leading-relaxed max-w-[48ch]">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Pick a skill", desc: "Tell Beacon what you want to learn and how much time you have." },
  { n: "02", title: "Get your path", desc: "An AI instructional designer drafts a four-week, lesson-by-lesson plan." },
  { n: "03", title: "Learn daily", desc: "Open the app, finish a lesson, pass the quiz, keep the streak." },
];

function HowItWorks() {
  return (
    <section id="how" className="border-y border-zinc-200/60 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="text-3xl sm:text-4xl font-bold tracking-tighter text-ink leading-none"
        >
          Three steps. Then a habit.
        </motion.h2>
        <div className="mt-12 grid md:grid-cols-3 gap-8 md:gap-6 relative">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08 }}
              className="relative"
            >
              <span className="font-mono text-5xl font-bold text-accent-200">{s.n}</span>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">{s.title}</h3>
              <p className="mt-2 text-zinc-600 leading-relaxed max-w-[40ch]">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "14,302", label: "lessons finished" },
  { value: "11 days", label: "median active streak" },
  { value: "2,600+", label: "skills mapped" },
];

function SocialProof() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="px-6 py-6 sm:py-2 text-center"
          >
            <p className="font-mono text-4xl font-bold tracking-tight text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-zinc-400">Illustrative — Beacon is brand new.</p>
    </section>
  );
}

function FooterCTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="relative rounded-[2.5rem] bg-ink text-canvas px-8 sm:px-16 py-16 sm:py-20 overflow-hidden text-center"
      >
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-accent-500/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-accent-400 text-ink mx-auto mb-6">
            <Lighthouse size={28} weight="fill" />
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tighter leading-none max-w-[20ch] mx-auto">
            Pick a skill and start in 30 seconds.
          </h2>
          <div className="mt-8 flex justify-center">
            <MagneticButton onClick={onStart} className="bg-accent-400 text-ink">
              Start learning free <ArrowRight size={18} weight="bold" />
            </MagneticButton>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
            {["Free to start", "No card required", "Any skill"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check size={14} weight="bold" className="text-accent-400" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-sm text-zinc-400">Beacon · learn anything, 90 seconds at a time</p>
      </div>
    </footer>
  );
}
