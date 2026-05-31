"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, Flame } from "@phosphor-icons/react";
import { Button } from "../ui/Button";
import { Logo } from "../ui/Logo";
import { Blob, Stamp } from "../ui/Riso";

const COPY = {
  login: {
    title: "Welcome back",
    sub: "Pick up your streak where you left off.",
    cta: "Log in",
    switchText: "New here?",
    switchLink: "/auth/signup",
    switchCta: "Create an account",
    endpoint: "/api/auth/login",
  },
  signup: {
    title: "Start learning today",
    sub: "One skill, four weeks, ninety seconds a day.",
    cta: "Create account",
    switchText: "Already have an account?",
    switchLink: "/auth/login",
    switchCta: "Log in",
    endpoint: "/api/auth/signup",
  },
} as const;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const copy = COPY[mode];
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(copy.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      const next = params.get("next");
      if (mode === "signup") {
        router.push("/onboarding");
      } else {
        router.push(next ?? (data.hasPath ? "/dashboard" : "/onboarding"));
      }
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-paper-2 border-r-2 border-line">
        <Blob spot="clay" shape={0} spin={10} className="w-80 h-80 -top-24 -right-20 opacity-80" />
        <Blob spot="teal" shape={2} motion="float" className="w-60 h-60 bottom-10 -left-24 opacity-70" />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.02] text-ink">
            Learn anything,
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 text-cream px-2">ninety seconds</span>
              <span aria-hidden className="absolute inset-0 -rotate-1 bg-clay border-2 border-line rounded-md" />
            </span>{" "}
            at a time.
          </h1>
          <p className="mt-6 text-ink-soft leading-relaxed max-w-[42ch]">
            A four-week path for any skill, dripped to you as short lessons. Quiz, earn XP, keep the streak alive.
          </p>

          {/* Mini app preview */}
          <div className="mt-9 max-w-sm rounded-xl border-2 border-line bg-cream p-4 shadow-hard">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">Machine Learning</span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-ink-soft">
                <Flame size={14} weight="fill" className="text-streak" /> 11
              </span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-paper border-2 border-line overflow-hidden">
              <div className="h-full w-[56%] bg-clay" />
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono text-xs text-ink-soft">
              <span className="grid place-items-center w-5 h-5 rounded-full bg-teal text-cream border-2 border-line">
                <Check size={10} weight="bold" />
              </span>
              18 of 32 lessons cleared
            </div>
          </div>
        </div>

        <p className="relative z-10 font-mono text-xs uppercase tracking-wide text-ink-faint">est. 2026 · built for the curious</p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-12 bg-paper overflow-hidden">
        <Blob spot="sun" shape={1} className="lg:hidden w-56 h-56 -top-20 -right-16 opacity-70" />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-ink">{copy.title}</h2>
              <p className="mt-2 text-ink-soft">{copy.sub}</p>
            </div>
            <Stamp spin={8} tone="clay" className="hidden sm:grid w-16 h-16 shrink-0 bg-cream shadow-hard-sm px-2">
              {mode === "signup" ? "New here" : "Hi again"}
            </Stamp>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {mode === "signup" && (
              <Field label="Name" htmlFor="name" optional>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?" className={inputClass} />
              </Field>
            )}
            <Field label="Email" htmlFor="email">
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputClass} />
            </Field>
            <Field label="Password" htmlFor="password" hint={mode === "signup" ? "At least 8 characters" : undefined}>
              <input id="password" type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
            </Field>

            {mode === "signup" && (
              <Field label="Confirm password" htmlFor="confirmPassword">
                <input
                  id="confirmPassword" type="password" required minLength={8} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className={inputClass + (confirmPassword && confirmPassword !== password ? " !border-berry focus:!ring-berry" : "")}
                />
                {confirmPassword && confirmPassword !== password && (
                  <span className="text-xs font-semibold text-berry -mt-1">Passwords don&rsquo;t match</span>
                )}
              </Field>
            )}

            {error && (
              <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-lg border-2 border-berry bg-berry-tint px-3 py-2 text-sm font-semibold text-berry -mt-1" role="alert">
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
              {loading ? "One moment…" : copy.cta}
              {!loading && <ArrowRight size={18} weight="bold" />}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink-soft">
            {copy.switchText}{" "}
            <Link href={copy.switchLink} className="font-bold text-clay-deep underline decoration-2 underline-offset-2 hover:text-clay">
              {copy.switchCta}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full h-12 rounded-lg border-2 border-line bg-cream px-4 text-ink placeholder:text-ink-faint " +
  "focus:outline-none focus:ring-2 focus:ring-clay focus:ring-offset-0 transition-shadow";

function Field({
  label, htmlFor, hint, optional, children,
}: {
  label: string; htmlFor: string; hint?: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="flex items-center justify-between text-sm font-bold text-ink">
        <span>{label}</span>
        {optional && <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink-faint">optional</span>}
      </label>
      {children}
      {hint && <span className="font-mono text-[11px] text-ink-faint">{hint}</span>}
    </div>
  );
}
