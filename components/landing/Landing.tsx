"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, Check, Flame, Clock, BookOpen, Lightbulb,
  MagicWand, ChartLineUp, Repeat, ChatCircle, Robot,
} from "@phosphor-icons/react";
import { Button } from "../ui/Button";
import { Logo } from "../ui/Logo";
import { Blob, Stamp } from "../ui/Riso";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 90, damping: 18 } },
};

export function Landing() {
  const router = useRouter();
  const start = () => router.push("/auth/signup");
  return (
    <div className="overflow-x-hidden">
      <SiteHeader />
      <Hero onStart={start} />
      <SkillIndex />
      <Statement />
      <Features />
      <HowItWorks onStart={start} />
      <FooterCTA onStart={start} />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-paper/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="md">Log in</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="secondary" size="md">Sign up</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <Blob spot="clay" shape={0} spin={12} className="w-[26rem] h-[26rem] -top-28 -right-24 opacity-80" />
      <Blob spot="teal" shape={2} spin={-10} motion="float" className="w-72 h-72 top-40 -left-28 opacity-70" />
      <Blob spot="sun" shape={1} className="w-44 h-44 bottom-[-3rem] right-[18%] opacity-80" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24
        grid lg:grid-cols-[1.08fr_0.92fr] gap-12 lg:gap-10 items-center">
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.09 } } }}>
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-cream px-3.5 py-1.5
              font-mono text-[11px] font-bold uppercase tracking-wide text-ink shadow-hard-sm"
          >
            <Robot size={13} weight="fill" className="text-clay-deep" />
            AI tutor · built-in chat · live hints
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-[-0.03em] leading-[0.92] text-ink"
          >
            Learn{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-cream px-2">anything</span>
              <span aria-hidden className="absolute inset-0 rotate-1 bg-teal border-2 border-line rounded-md" />
            </span>
            <br />
            in{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-cream px-2">ninety</span>
              <span aria-hidden className="absolute inset-0 -rotate-1 bg-clay border-2 border-line rounded-md" />
            </span>{" "}
            seconds.
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 text-lg text-ink-soft leading-relaxed max-w-[48ch]">
            Name any skill — cooking, chess, contract law, ancient history, anything. Beacon
            builds your path in seconds and teaches it one 90-second lesson at a time, with a
            live AI tutor that already read the material before you got there.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={onStart}>
              Start learning <ArrowRight size={18} weight="bold" />
            </Button>
            <Link href="#how">
              <Button variant="secondary" size="lg">How it works</Button>
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-5 font-mono text-xs uppercase tracking-wide text-ink-faint">
            Free to start · no card · pick a skill in 30 seconds
          </motion.p>
        </motion.div>

        <HeroPreview />
      </div>
    </section>
  );
}

// A miniature of the real workspace — a sticker pinned to the page.
function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: 1.5 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="relative"
    >
      <div className="rounded-2xl border-2 border-line bg-cream p-5 sm:p-6 shadow-hard-lg">
        <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
          <span>Curriculum</span>
          <span>56% done</span>
        </div>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Chess Strategy</h3>

        <div className="mt-4 grid grid-cols-3 border-2 border-line rounded-lg overflow-hidden divide-x-2 divide-line">
          <MiniStat label="Streak" value="11" tint="bg-sun-tint" />
          <MiniStat label="Level" value="7" tint="bg-teal-tint" />
          <MiniStat label="XP" value="2,340" tint="bg-clay-tint" />
        </div>

        <div className="mt-4 relative rounded-lg border-2 border-line bg-clay-tint p-4">
          <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-clay-deep">
            <span className="w-1.5 h-1.5 rounded-full bg-clay animate-pulse" /> Up next
          </p>
          <p className="mt-1 text-sm font-bold text-ink">The Sicilian: control the centre</p>
        </div>

        <div className="mt-3 divide-y-2 divide-ink/15 border-t-2 border-ink/15">
          {[
            { t: "Why pawns control the board", s: "94" },
            { t: "Castling — safety vs. timing", s: "88" },
          ].map((r) => (
            <div key={r.t} className="flex items-center gap-3 py-2.5">
              <span className="grid place-items-center w-5 h-5 rounded-full bg-teal text-cream border-2 border-line">
                <Check size={10} weight="bold" />
              </span>
              <span className="flex-1 text-xs text-ink-soft truncate">{r.t}</span>
              <span className="font-mono text-[10px] font-bold text-teal-deep">{r.s}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating postmark */}
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-6 -left-4 sm:-left-7"
      >
        <Stamp spin={-12} tone="sun" className="w-20 h-20 bg-cream shadow-hard-sm">
          <span className="flex flex-col items-center leading-none">
            <Flame size={16} weight="fill" className="text-streak mb-0.5" />
            Day 11
            <span className="text-ink-faint">streak</span>
          </span>
        </Stamp>
      </motion.div>
    </motion.div>
  );
}

function MiniStat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className={`px-3 py-2.5 ${tint}`}>
      <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold text-ink tabular-nums">{value}</p>
    </div>
  );
}

// ── Skill index ──────────────────────────────────────────────────────────────
const SKILLS = [
  "Personal Finance", "Watercolour Painting", "Negotiation", "Music Theory", "Astrophysics",
  "Grant Writing", "Chess Openings", "Sourdough Baking", "Typography", "Mandarin",
  "Contract Law", "Stand-up Comedy", "Stoicism", "Oil Painting", "Beekeeping",
  "Screenwriting", "Salsa Dancing", "Ancient History", "Wine Tasting", "Origami",
];

function SkillIndex() {
  return (
    <section className="border-y-2 border-line bg-paper-2">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
        <div className="mb-6 grid lg:grid-cols-[auto_1fr] gap-4 lg:gap-10 items-baseline">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep shrink-0">
            / Any skill. We mean it.
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink leading-tight">
            Sourdough. Salsa dancing. Contract law. Beekeeping.{" "}
            <span className="text-ink/35">The list genuinely does not end.</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s, i) => (
            <span
              key={s}
              className={`inline-flex items-center rounded-full border-2 border-line px-3.5 py-1.5 text-sm font-semibold text-ink
                ${i % 3 === 0 ? "bg-clay-tint" : i % 3 === 1 ? "bg-teal-tint" : "bg-sun-tint"}`}
            >
              {s}
            </span>
          ))}
          <span className="inline-flex items-center rounded-full border-2 border-dashed border-ink/25 px-3.5 py-1.5 text-sm font-semibold text-ink-faint">
            + anything else
          </span>
        </div>
      </div>
    </section>
  );
}

// ── Statement ─────────────────────────────────────────────────────────────────
function Statement() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-[0.8fr_1.2fr] gap-8 lg:gap-12 items-start">
      <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep">
        / The problem with courses
      </motion.p>
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink leading-[1.04]">
          A course wants an hour you don&rsquo;t have. Beacon asks for{" "}
          <span className="text-clay-deep underline decoration-2 decoration-clay underline-offset-4">ninety seconds</span>{" "}
          and gives you an AI tutor for the rest.
        </h2>
        <p className="mt-6 text-lg text-ink-soft leading-relaxed max-w-[58ch]">
          One idea, one example, one quiz — then a live AI tutor that knows exactly
          which concept you just studied. Ask it anything. Get a two-sentence answer,
          not a link to a 45-minute video. Done for the day, streak intact.
        </p>
      </motion.div>
    </section>
  );
}

// ── Features (zigzag) ─────────────────────────────────────────────────────────
function Features() {
  return (
    <section className="border-t-2 border-line bg-paper-2">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-24 flex flex-col gap-20 sm:gap-28">
        <FeatureRow
          n="01" spot="clay" icon={MagicWand}
          eyebrow="Instant curriculum"
          title="Type a skill. Get a real path."
          body="Beacon designs a coherent, multi-phase path, sequenced from first principles — not a pile of links. Go at your own pace. Generated once, yours forever."
          visual={<MockPath />}
        />
        <FeatureRow
          reverse n="02" spot="teal" icon={Lightbulb}
          eyebrow="90-second lessons + smart hints"
          title="One concept, then prove it stuck."
          body="Each lesson is a single idea with a concrete example, then a short quiz. Stuck on a question? The hint lamp gives you one precise nudge — not the answer, just enough to unblock you. Pass at 80% to move on."
          visual={<MockQuiz />}
        />
        <FeatureRow
          n="03" spot="clay" icon={ChatCircle}
          eyebrow="Built-in AI tutor"
          title="Ask anything. It already read the lesson."
          body="Every lesson ships with a chat tutor preloaded with the full lesson context. Ask for a different analogy, challenge an idea, figure out why your answer was wrong. Real explanations — not a search engine, not a PDF, not a 40-minute detour."
          visual={<MockChat />}
        />
        <FeatureRow
          reverse n="04" spot="sun" icon={ChartLineUp}
          eyebrow="Momentum, built in"
          title="Streaks, XP, and badges that pull you back."
          body="Every correct answer moves a bar. Fifty levels, eleven badges, and a streak that makes opening the app the easy choice tomorrow. Miss a day and you lose the streak — never the progress."
          visual={<MockProgress />}
        />
      </div>
    </section>
  );
}

function FeatureRow({
  n, spot, icon: Icon, eyebrow, title, body, visual, reverse,
}: {
  n: string; spot: "clay" | "teal" | "sun"; icon: React.ElementType;
  eyebrow: string; title: string; body: string; visual: React.ReactNode; reverse?: boolean;
}) {
  const iconBg = spot === "clay" ? "bg-clay-tint text-clay-deep" : spot === "teal" ? "bg-teal-tint text-teal-deep" : "bg-sun-tint text-ink";
  return (
    <motion.div
      variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
      className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center"
    >
      <div className={reverse ? "lg:order-2" : ""}>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-5xl font-extrabold text-ink/15 leading-none">{n}</span>
          <span className={`grid place-items-center w-11 h-11 rounded-lg border-2 border-line ${iconBg}`}>
            <Icon size={22} weight="bold" />
          </span>
        </div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep">{eyebrow}</p>
        <h3 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight max-w-[18ch]">{title}</h3>
        <p className="mt-3 text-ink-soft leading-relaxed max-w-[46ch]">{body}</p>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
    </motion.div>
  );
}

function MockShell({ children, tilt = -1.2 }: { children: React.ReactNode; tilt?: number }) {
  return (
    <motion.div
      whileHover={{ rotate: 0, y: -2 }}
      style={{ rotate: tilt }}
      className="rounded-2xl border-2 border-line bg-cream p-5 sm:p-6 shadow-hard-lg"
    >
      {children}
    </motion.div>
  );
}

function MockPath() {
  const phases = [
    { n: "01", t: "Foundations", done: true },
    { n: "02", t: "Core mechanics", done: false },
    { n: "03", t: "Going deeper", done: false },
    { n: "04", t: "Putting it together", done: false },
  ];
  return (
    <MockShell tilt={1.2}>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint mb-3">Your learning path</p>
      <div className="divide-y-2 divide-ink/15 border-y-2 border-ink/15">
        {phases.map((ph) => (
          <div key={ph.n} className="flex items-center gap-3 py-3">
            <span className={`font-mono text-xs font-bold ${ph.done ? "text-teal-deep" : "text-ink-faint"}`}>{ph.n}</span>
            <span className="flex-1 text-sm font-medium text-ink">{ph.t}</span>
            {ph.done
              ? <span className="grid place-items-center w-5 h-5 rounded-full bg-teal text-cream border-2 border-line"><Check size={10} weight="bold" /></span>
              : <span className="font-mono text-[10px] text-ink-faint">6 lessons</span>}
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function MockQuiz() {
  const opts = [
    { t: "It minimises a loss function", correct: true },
    { t: "It memorises the data", correct: false },
    { t: "It sorts the inputs", correct: false },
  ];
  return (
    <MockShell>
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="flex gap-2 text-sm font-bold text-ink">
          <span className="font-mono text-clay-deep">1.</span>
          <span>What does training actually do?</span>
        </p>
        <span className="shrink-0 grid place-items-center w-8 h-8 rounded-full border-2 border-line bg-sun-tint text-clay-deep">
          <Lightbulb size={14} weight="fill" />
        </span>
      </div>
      <div className="mb-3 flex items-start gap-2 rounded-lg border-2 border-line bg-sun-tint px-3 py-2 text-xs text-ink-soft leading-relaxed">
        <Lightbulb size={12} weight="fill" className="shrink-0 mt-0.5 text-clay-deep" />
        Think about what the algorithm is trying to reduce.
      </div>
      <div className="grid gap-2.5">
        {opts.map((o) => (
          <div
            key={o.t}
            className={`flex items-center justify-between gap-3 rounded-lg border-2 px-3.5 py-2.5 text-sm font-medium ${
              o.correct ? "border-line bg-teal-tint text-teal-deep" : "border-ink/20 bg-paper text-ink-soft"
            }`}
          >
            <span>{o.t}</span>
            {o.correct && <span className="grid place-items-center w-5 h-5 rounded-full bg-teal text-cream border-2 border-line"><Check size={10} weight="bold" /></span>}
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
        <Clock size={12} /> ~90 seconds · pass at 80%
      </p>
    </MockShell>
  );
}

function MockChat() {
  const msgs = [
    { role: "user", text: "What's the difference between BATNA and a reservation price?" },
    { role: "ai",   text: "BATNA is your best outside option if talks fail. Reservation price is the worst deal you'd still accept. Your BATNA is what determines where that line sits." },
    { role: "user", text: "So improving my BATNA before talks even start matters?" },
    { role: "ai",   text: "It's the highest-leverage prep move. Better alternatives mean you can walk away credibly — that shifts power before either party says a word." },
  ];
  return (
    <MockShell tilt={-1.2}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-line">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-clay-deep">Lesson tutor</p>
          <p className="mt-0.5 text-sm font-bold text-ink">Negotiation: BATNA</p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-teal-deep">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
          Online
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[86%] rounded-xl px-3 py-2 text-xs leading-relaxed
              ${m.role === "user"
                ? "bg-clay text-cream rounded-br-sm"
                : "bg-paper border-2 border-line text-ink rounded-bl-sm"}`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2 items-center">
        <div className="flex-1 h-8 rounded-lg border-2 border-line bg-paper px-3 flex items-center">
          <span className="text-xs text-ink-faint">Ask about this lesson…</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-clay border-2 border-transparent grid place-items-center">
          <ArrowRight size={13} weight="bold" className="text-cream" />
        </div>
      </div>
    </MockShell>
  );
}

function MockProgress() {
  return (
    <MockShell tilt={1.2}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-sun text-ink font-mono text-xs font-bold border-2 border-line">7</span>
          Level 7
        </span>
        <span className="font-mono text-xs font-bold text-ink-soft">2,340 XP</span>
      </div>
      <div className="mt-3 h-3 rounded-full bg-paper border-2 border-line overflow-hidden">
        <div className="h-full w-[68%] bg-clay" />
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2.5">
        {[
          { i: Flame, on: true }, { i: BookOpen, on: true }, { i: Repeat, on: true }, { i: ChartLineUp, on: false },
        ].map(({ i: Ic, on }, idx) => (
          <div key={idx} className={`grid place-items-center aspect-square rounded-lg border-2 border-line ${on ? "bg-clay text-cream" : "bg-paper text-ink-faint"}`}>
            <Ic size={18} weight={on ? "fill" : "regular"} />
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-faint">3 of 11 badges earned</p>
    </MockShell>
  );
}

// ── How it works ────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Pick a skill", desc: "Tell Beacon what you want to learn and how much time you have — or let it suggest something. Anything works." },
  { n: "02", title: "Get your path", desc: "An AI builds a sequenced, multi-phase path in under 20 seconds. Every lesson written, every quiz generated, every hint pre-loaded." },
  { n: "03", title: "Learn daily — with AI on call", desc: "Open the app, clear a lesson, ask your AI tutor anything you're fuzzy on. 90 seconds. Streak stays alive." },
];

function HowItWorks({ onStart }: { onStart: () => void }) {
  return (
    <section id="how" className="scroll-mt-16 max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
      <motion.h2
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink leading-none"
      >
        Three steps. Then a habit.
      </motion.h2>
      <div className="mt-12 grid md:grid-cols-3 gap-6 md:gap-7 relative">
        <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 border-t-2 border-dashed border-line" />
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08 }}
            className="relative rounded-2xl border-2 border-line bg-cream p-6 shadow-hard"
          >
            <span className="relative grid place-items-center w-12 h-12 rounded-full bg-clay text-cream border-2 border-line
              font-mono text-base font-bold shadow-hard-sm">
              {s.n}
            </span>
            <h3 className="mt-4 text-xl font-extrabold tracking-tight text-ink">{s.title}</h3>
            <p className="mt-2 text-ink-soft leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Button size="lg" onClick={onStart}>
          Map your first path <ArrowRight size={18} weight="bold" />
        </Button>
      </div>
    </section>
  );
}

// ── Footer CTA ──────────────────────────────────────────────────────────────
function FooterCTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <motion.div
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="relative rounded-3xl border-2 border-clay bg-paper-2 px-8 sm:px-16 py-16 sm:py-20 text-center overflow-hidden shadow-hard-lg"
      >
        <Blob spot="clay" shape={1} className="w-64 h-64 -top-20 -left-16 opacity-90" />
        <Blob spot="teal" shape={3} motion="float" className="w-52 h-52 -bottom-16 -right-12 opacity-80" />

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink leading-none max-w-[22ch] mx-auto">
            A private AI tutor for any skill. Starts in 30 seconds.
          </h2>
          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={onStart}>
              Start learning free <ArrowRight size={18} weight="bold" />
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-sm text-ink-soft">
            {["Free to start", "No card required", "AI tutor on every lesson"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check size={14} weight="bold" className="text-teal-deep" /> {t}
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
    <footer className="border-t-2 border-line bg-paper-2">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Beacon · est. 2026 · built for the curious</p>
      </div>
    </footer>
  );
}
