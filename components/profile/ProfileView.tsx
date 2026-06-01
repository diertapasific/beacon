"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Trophy, Books, CheckCircle, SignOut, Trash, Warning,
  Lightbulb, Bug, ChatCircleDots, PaperPlaneTilt,
} from "@phosphor-icons/react";
import type { ProfileData } from "@/lib/queries";
import { Button } from "../ui/Button";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 110, damping: 20 } },
};

function joinedLabel(iso: string): string {
  // timeZone: UTC keeps server and client renders identical (no hydration drift).
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function ProfileView({ data }: { data: ProfileData }) {
  const router = useRouter();
  const initial = (data.name?.trim()?.[0] ?? data.email[0] ?? "?").toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-24"
    >
      {/* Identity */}
      <motion.div variants={item} className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-clay text-cream border-2 border-line shadow-hard-clay shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold">{initial}</span>
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep">Profile</p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-none truncate">
              {data.name?.trim() || "Learner"}
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft truncate">{data.email}</p>
          </div>
        </div>
        <Button variant="secondary" size="md" onClick={logout} className="shrink-0">
          <SignOut size={18} />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </motion.div>

      {/* Primary stats — the three the user wanted off the learn page */}
      <motion.div variants={item} className="mt-8 rounded-xl border-2 border-line overflow-hidden shadow-hard">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-line">
          <Stat
            label="Streak"
            value={`${data.streak.current}`}
            unit="days"
            icon={<Flame size={14} weight="fill" className={data.streak.current > 0 ? "text-streak" : "text-ink-faint"} />}
            sub={`Longest ${data.streak.longest}`}
          />
          <Stat
            label="Level"
            value={`${data.xp.level}`}
            sub={data.xp.toNext > 0 ? `${data.xp.toNext.toLocaleString("en-US")} XP to L${data.xp.level + 1}` : "Max level"}
          />
          <Stat label="Total XP" value={data.xp.total.toLocaleString("en-US")} sub={`Joined ${joinedLabel(data.memberSince)}`} />
        </div>
      </motion.div>

      {/* Level progress */}
      <motion.div variants={item} className="mt-4 flex items-center gap-3">
        <div className="h-3 flex-1 rounded-full bg-cream border-2 border-line overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.xp.progressPct}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-clay"
          />
        </div>
        <span className="font-mono text-[11px] font-bold text-ink-soft tabular-nums shrink-0">
          {data.xp.progressPct}%
        </span>
      </motion.div>

      {/* Secondary stats */}
      <motion.div variants={item} className="mt-8 grid grid-cols-3 gap-3">
        <MiniStat icon={<CheckCircle size={16} weight="fill" />} value={`${data.totals.lessonsCompleted}`} label="Lessons done" />
        <MiniStat icon={<Books size={16} weight="fill" />} value={`${data.totals.paths}`} label="Paths" />
        <MiniStat icon={<Trophy size={16} weight="fill" />} value={`${data.totals.achievements}`} label="Badges" />
      </motion.div>

      {/* Account */}
      <motion.section variants={item} className="mt-12">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft mb-4">/ Account</h2>
        <DangerZone />
      </motion.section>
    </motion.main>
  );
}

function Stat({ label, value, unit, icon, sub }: { label: string; value: string; unit?: string; icon?: React.ReactNode; sub?: string }) {
  return (
    <div className="px-5 py-5 bg-cream">
      <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-soft">
        {icon}{label}
      </p>
      <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-ink leading-none">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-ink-soft">{unit}</span>}
      </p>
      {sub && <p className="mt-2 font-mono text-[11px] text-ink-faint tabular-nums">{sub}</p>}
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border-2 border-line bg-cream px-4 py-3.5 shadow-hard-sm">
      <span className="text-clay-deep">{icon}</span>
      <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-ink leading-none">{value}</p>
      <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}

// ── Danger zone: destructive account deletion ─────────────────────────────────
function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "deleting" | "error">("idle");

  async function deleteAccount() {
    setState("deleting");
    try {
      const res = await fetch("/api/auth/delete", { method: "POST" });
      if (!res.ok) throw new Error();
      router.push("/");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  const canDelete = text.trim().toUpperCase() === "DELETE" && state !== "deleting";

  return (
    <div className="rounded-2xl border-2 border-berry/40 bg-berry-tint/40 overflow-hidden">
        <div className="flex items-start gap-3 p-5">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-berry/15 text-berry shrink-0">
            <Warning size={18} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-ink">Delete account</h3>
            <p className="mt-1 text-sm text-ink-soft leading-relaxed max-w-[60ch]">
              This permanently erases your account, every learning path, your XP, streak and badges. There is no undo.
            </p>

            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-berry/50 text-berry
                  px-4 h-11 text-sm font-semibold uppercase tracking-wide hover:bg-berry hover:text-cream
                  transition-colors active:scale-[0.97]"
              >
                <Trash size={16} weight="bold" />
                Delete account
              </button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 space-y-3"
                >
                  <label className="block">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                      Type DELETE to confirm
                    </span>
                    <input
                      autoFocus
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="DELETE"
                      className="mt-1.5 w-full sm:max-w-xs rounded-xl border-2 border-line bg-paper px-4 h-11 text-sm
                        font-mono tracking-wide text-ink placeholder:text-ink-faint focus:outline-none focus:border-berry"
                    />
                  </label>

                  {state === "error" && (
                    <p className="text-sm font-medium text-berry">Something went wrong. Please try again.</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={deleteAccount}
                      disabled={!canDelete}
                      className="inline-flex items-center gap-2 rounded-xl bg-berry text-cream px-4 h-11 text-sm
                        font-semibold uppercase tracking-wide disabled:opacity-40 disabled:pointer-events-none
                        hover:brightness-105 active:scale-[0.97] transition"
                    >
                      {state === "deleting" ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-cream animate-bounce" />
                          Deleting
                        </>
                      ) : (
                        <>
                          <Trash size={16} weight="bold" />
                          Delete forever
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { setConfirming(false); setText(""); setState("idle"); }}
                      disabled={state === "deleting"}
                      className="inline-flex items-center rounded-xl px-4 h-11 text-sm font-semibold uppercase
                        tracking-wide text-ink-soft hover:bg-paper-2 active:scale-[0.97] transition-colors disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
  );
}
