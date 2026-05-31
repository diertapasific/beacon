"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lighthouse, ArrowRight } from "@phosphor-icons/react";
import { Button } from "../ui/Button";

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
    <div className="min-h-[100dvh] grid lg:grid-cols-2">
      {/* Brand panel — left, desktop only */}
      <div className="relative hidden lg:flex flex-col justify-between bg-ink text-canvas p-12 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl" />
        <Link href="/" className="inline-flex items-center gap-2 relative">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent-400 text-ink">
            <Lighthouse size={20} weight="fill" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Beacon</span>
        </Link>
        <div className="relative">
          <h1 className="text-4xl xl:text-5xl font-bold tracking-tighter leading-none">
            Learn anything,
            <br />
            <span className="text-accent-400">ninety seconds</span> at a time.
          </h1>
          <p className="mt-6 text-zinc-400 leading-relaxed max-w-[40ch]">
            Beacon builds a four-week path for any skill, then drips it to you as
            bite-sized lessons. Quiz, earn XP, keep the streak alive.
          </p>
        </div>
        <p className="relative text-sm text-zinc-500 font-mono">est. 2026 · built for the curious</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-ink text-accent-400">
              <Lighthouse size={20} weight="fill" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-ink">Beacon</span>
          </Link>

          <h2 className="text-3xl font-bold tracking-tighter text-ink">{copy.title}</h2>
          <p className="mt-2 text-zinc-500">{copy.sub}</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {mode === "signup" && (
              <Field label="Name" htmlFor="name" optional>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className={inputClass}
                />
              </Field>
            )}
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              hint={mode === "signup" ? "At least 8 characters" : undefined}
            >
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </Field>

            {mode === "signup" && (
              <Field label="Confirm password" htmlFor="confirmPassword">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={
                    inputClass +
                    (confirmPassword && confirmPassword !== password
                      ? " !border-rose-400 focus:!ring-rose-400"
                      : "")
                  }
                />
                {confirmPassword && confirmPassword !== password && (
                  <span className="text-xs text-rose-500 -mt-1">Passwords don't match</span>
                )}
              </Field>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-rose-600 -mt-2"
                role="alert"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
              {loading ? "One moment…" : copy.cta}
              {!loading && <ArrowRight size={18} weight="bold" />}
            </Button>
          </form>

          <p className="mt-6 text-sm text-zinc-500">
            {copy.switchText}{" "}
            <Link href={copy.switchLink} className="font-semibold text-accent-700 hover:underline">
              {copy.switchCta}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full h-12 rounded-xl border border-zinc-200 bg-white px-4 text-ink placeholder:text-zinc-400 " +
  "focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow";

function Field({
  label,
  htmlFor,
  hint,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="flex items-center justify-between text-sm font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-zinc-400">optional</span>}
      </label>
      {children}
      {hint && <span className="text-xs text-zinc-400">{hint}</span>}
    </div>
  );
}
