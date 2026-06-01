"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X } from "@phosphor-icons/react";
import { Mascot, type GlowState } from "../ui/Mascot";

interface TourStep {
  /** `data-tour` value of the element to spotlight. Omit for a centered card. */
  target?: string;
  title: string;
  body: string;
  mascot?: GlowState;
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to Beacon",
    body: "Your path is ready. Here's the 20-second tour of how it all works.",
    mascot: "celebrate",
  },
  {
    target: "next-lesson",
    title: "Start here",
    body: "Your next lesson is always one tap away — short, focused, and it picks up exactly where you left off.",
  },
  {
    target: "path",
    title: "Your full path",
    body: "Every lesson, grouped into phases. Clear one to unlock the next — tap any phase to peek inside.",
  },
  {
    target: "streak",
    title: "Keep your streak alive",
    body: "Finish at least one lesson a day to grow your streak. Miss a day and it resets, so keep the flame lit.",
  },
  {
    target: "badges",
    title: "Collect badges",
    body: "Hit milestones — your first lesson, streaks, level-ups — and these light up.",
  },
  {
    title: "You're all set",
    body: "That's the whole loop. Tap Start and clear your first lesson.",
    mascot: "idle",
  },
];

const PAD = 8; // spotlight padding around the target
const GAP = 14; // gap between spotlight and tooltip card
const CARD_W = 360;

function findTarget(name: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  // Pick the first element that's actually rendered (handles desktop-rail vs
  // mobile-bar duplicates — the hidden one has a zero-size rect).
  return els.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }) ?? null;
}

export function OnboardingTour() {
  const [mounted, setMounted] = useState(false);
  const [gone, setGone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Client-only mount gate: the portal targets document.body, so we render
  // null until after hydration to keep server and first client render in sync.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const measure = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    const name = STEPS[step].target;
    if (!name) {
      setRect(null);
      return;
    }
    const el = findTarget(name);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // On step change: scroll the target into view, then measure (twice — once
  // immediately, once after the smooth scroll settles).
  useEffect(() => {
    if (!mounted) return;
    const name = STEPS[step].target;
    const el = name ? findTarget(name) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Measure after paint, then again once the smooth scroll has settled.
    const raf = requestAnimationFrame(measure);
    const t = setTimeout(measure, 340);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [step, mounted, measure]);

  // Keep the spotlight pinned to the target as the page scrolls or resizes.
  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [mounted, measure]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // Fire-and-forget — the flag is server-side, so a failure just means the
    // tour may reappear on a later visit; never block the UI on it.
    fetch("/api/onboarding/complete", { method: "POST" }).catch(() => {});
    setVisible(false);
  }, []);

  // Esc skips the tour.
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, finish]);

  // Position the card from its measured size, then clamp it fully on-screen.
  // Runs after layout so the spotlight and a tall target can never push it
  // off the top/bottom or off a narrow viewport.
  useLayoutEffect(() => {
    if (!mounted) return;
    const card = cardRef.current;
    if (!card) return;
    const M = 12; // min margin from any viewport edge
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    let top: number, left: number;
    if (!rect) {
      left = (vp.w - cw) / 2;
      top = (vp.h - ch) / 2;
    } else {
      left = rect.left + rect.width / 2 - cw / 2;
      const below = rect.bottom + GAP;
      const above = rect.top - GAP - ch;
      // Prefer below the target, else above, else let the clamp handle it.
      top = below + ch + M <= vp.h ? below : above >= M ? above : below;
    }
    left = Math.min(Math.max(left, M), Math.max(M, vp.w - cw - M));
    top = Math.min(Math.max(top, M), Math.max(M, vp.h - ch - M));
    setPos({ top, left });
  }, [rect, vp, step, mounted]);

  if (!mounted || gone) return null;

  const cardW = Math.min(CARD_W, vp.w - 24);

  return createPortal(
    <AnimatePresence onExitComplete={() => setGone(true)}>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100]"
          aria-modal="true"
          role="dialog"
        >
          {/* Click blocker — swallows interaction with the page behind. */}
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

          {/* Spotlight / dimmer */}
          {rect ? (
            <motion.div
              initial={false}
              animate={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute rounded-2xl border-2 border-clay pointer-events-none"
              style={{ boxShadow: "0 0 0 9999px rgba(24,24,24,0.62)" }}
            />
          ) : (
            <div className="absolute inset-0 bg-[rgba(24,24,24,0.62)]" />
          )}

          {/* Tooltip card — measured then clamped, so it's always fully visible */}
          <div
            ref={cardRef}
            className="absolute pointer-events-auto rounded-2xl border-2 border-line bg-cream shadow-hard-lg p-5 sm:p-6 overflow-y-auto"
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: cardW,
              maxHeight: "calc(100dvh - 24px)",
              visibility: pos ? "visible" : "hidden",
            }}
          >
            <button
              onClick={finish}
              aria-label="Skip tour"
              className="absolute top-3.5 right-3.5 grid place-items-center w-8 h-8 rounded-lg text-ink-faint
                hover:text-ink hover:bg-paper-2 active:scale-95 transition-colors"
            >
              <X size={16} weight="bold" />
            </button>

            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="flex items-start gap-3 pr-8">
                {current.mascot && (
                  <Mascot state={current.mascot} size={64} className="-mt-1 -ml-1 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-clay-deep">
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <h3 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink leading-tight">
                    {current.title}
                  </h3>
                </div>
              </div>

              <p className="mt-3 text-sm text-ink-soft leading-relaxed max-w-[46ch]">{current.body}</p>

              <div className="mt-5 flex items-center justify-between gap-3">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === step ? "w-5 bg-clay" : "w-1.5 bg-line"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={() => setStep((s) => Math.max(s - 1, 0))}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 h-10 text-sm font-bold text-ink-soft
                        hover:bg-paper-2 active:scale-[0.97] transition-colors"
                    >
                      <ArrowLeft size={15} weight="bold" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
                    className="inline-flex items-center gap-2 rounded-xl bg-clay text-cream border-2 border-transparent
                      shadow-hard-clay press-clay px-4 h-10 text-sm font-bold uppercase tracking-wide"
                  >
                    {isLast ? "Start" : "Next"}
                    <ArrowRight size={15} weight="bold" />
                  </button>
                </div>
              </div>

              {!isLast && (
                <button
                  onClick={finish}
                  className="mt-3 font-mono text-[11px] font-bold uppercase tracking-wide text-ink-faint
                    hover:text-ink-soft transition-colors"
                >
                  Skip tour
                </button>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
