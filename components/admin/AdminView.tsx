"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Books, CheckCircle, Flame, ChatCircleDots,
  Lightbulb, Bug, TrendUp, TrendDown, Minus,
  UsersThree, Target, Lightning, ChartLineUp,
  ArrowClockwise, DownloadSimple, MagnifyingGlass, Crown,
} from "@phosphor-icons/react";
import type { AdminStats, DayPoint, WoW } from "@/lib/admin";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 110, damping: 20 } },
};

// "YYYY-MM-DD" → label without touching Date() (keeps SSR == client).
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDay(iso: string): { day: string; full: string } {
  const [y, m, d] = iso.split("-");
  const mon = MONTHS[Number(m) - 1] ?? m;
  return { day: String(Number(d)), full: `${mon} ${Number(d)}, ${y}` };
}
function fmtStamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC",
  });
}

type Range = 7 | 14 | 30;

export function AdminView({ stats }: { stats: AdminStats }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [range, setRange] = useState<Range>(14);

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-[1100px] mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-24"
    >
      <motion.header variants={item} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep">Admin</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-none">
            Mission control
          </h1>
          <p className="mt-2 text-sm text-ink-soft max-w-[60ch]">
            Platform health at a glance — growth, engagement and what learners are telling you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-ink-faint tabular-nums hidden sm:inline">
            Updated {fmtStamp(stats.generatedAt)} UTC
          </span>
          <button
            onClick={() => startRefresh(() => router.refresh())}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-line bg-cream shadow-hard-sm
              px-3.5 h-10 text-sm font-semibold text-ink hover:bg-paper-2 active:translate-y-0.5
              active:shadow-none disabled:opacity-60 transition"
          >
            <ArrowClockwise size={15} weight="bold" className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </motion.header>

      {/* KPIs */}
      <motion.div
        variants={item}
        className="mt-8 rounded-xl border-2 border-line overflow-hidden shadow-hard
          grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
          divide-x-2 divide-y-2 lg:divide-y-0 divide-line"
      >
        <Kpi label="Learners" value={stats.totals.users} icon={<Users size={14} weight="fill" />} />
        <Kpi label="Paths built" value={stats.totals.paths} icon={<Books size={14} weight="fill" />} />
        <Kpi label="Lessons done" value={stats.totals.lessonsCompleted} icon={<CheckCircle size={14} weight="fill" />} />
        <Kpi label="Active streaks" value={stats.totals.activeStreaks} icon={<Flame size={14} weight="fill" className="text-streak" />} />
        <Kpi label="Feedback" value={stats.totals.feedback} icon={<ChatCircleDots size={14} weight="fill" />} />
      </motion.div>

      {/* Engagement */}
      <motion.div variants={item} className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={<UsersThree size={16} weight="fill" />} value={`${stats.engagement.activeLearners7d}`} label="Active · 7d" />
        <Metric icon={<Target size={16} weight="fill" />} value={`${stats.engagement.completionRate}%`} label="Completion rate" />
        <Metric icon={<Lightning size={16} weight="fill" />} value={compact(stats.engagement.totalXp)} label="XP earned" />
        <Metric icon={<ChartLineUp size={16} weight="fill" />} value={`${stats.engagement.avgLessonsPerLearner}`} label="Lessons / learner" />
      </motion.div>

      {/* Range toggle */}
      <motion.div variants={item} className="mt-8 flex items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">/ Trends</h2>
        <div className="inline-flex rounded-xl border-2 border-line bg-cream p-0.5 shadow-hard-sm">
          {([7, 14, 30] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 h-8 font-mono text-xs font-bold tabular-nums transition-colors ${
                range === r ? "bg-clay text-cream" : "text-ink-soft hover:text-ink"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <ChartCard title="New learners" range={range} data={stats.signups} delta={stats.deltas.signups} accent="bg-clay" />
        </motion.div>
        <motion.div variants={item}>
          <ChartCard title="Lessons completed" range={range} data={stats.lessons} delta={stats.deltas.lessons} accent="bg-teal" />
        </motion.div>
      </div>

      {/* Skills + levels */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.section variants={item} className="rounded-2xl border-2 border-line bg-cream shadow-hard p-6">
          <SectionHead title="Top skills" sub={`${stats.topSkills.length} of many`} />
          {stats.topSkills.length === 0 ? (
            <Empty>No paths have been generated yet.</Empty>
          ) : (
            <ul className="mt-5 space-y-3">
              {stats.topSkills.map((s, i) => (
                <RankedBar key={s.skill} label={s.skill} value={s.count} max={stats.topSkills[0].count} index={i} accent="bg-clay" />
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section variants={item} className="rounded-2xl border-2 border-line bg-cream shadow-hard p-6">
          <SectionHead title="Learner levels" sub="Distribution" />
          {stats.levels.length === 0 ? (
            <Empty>No learners yet.</Empty>
          ) : (
            <ul className="mt-5 space-y-3">
              {stats.levels.map((l, i) => (
                <RankedBar
                  key={l.level}
                  label={`Level ${l.level}`}
                  value={l.count}
                  max={Math.max(...stats.levels.map((x) => x.count))}
                  index={i}
                  accent="bg-sun"
                />
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* Leaderboard */}
      <motion.section variants={item} className="mt-6">
        <Leaderboard learners={stats.topLearners} />
      </motion.section>

      {/* Feedback */}
      <motion.section variants={item} className="mt-6">
        <FeedbackFeed items={stats.recentFeedback} counts={stats.feedbackCounts} />
      </motion.section>
    </motion.main>
  );
}

// 12345 → "12.3k"; keeps big XP totals readable.
function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function Kpi({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="px-5 py-5 bg-cream">
      <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-soft">
        <span className="text-clay-deep">{icon}</span>{label}
      </p>
      <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-ink leading-none">
        {value.toLocaleString("en-US")}
      </p>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border-2 border-line bg-cream px-4 py-3.5 shadow-hard-sm">
      <span className="text-clay-deep">{icon}</span>
      <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-ink leading-none">{value}</p>
      <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-base font-extrabold tracking-tight text-ink">{title}</h2>
      {sub && <span className="font-mono text-[11px] text-ink-faint uppercase tracking-wide">{sub}</span>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-xl border-2 border-dashed border-line bg-paper-2 px-5 py-8 text-center">
      <p className="text-sm text-ink-faint">{children}</p>
    </div>
  );
}

// Week-over-week pill — green up / red down / grey flat.
function DeltaPill({ delta }: { delta: WoW }) {
  const diff = delta.current - delta.prev;
  const pct = delta.prev > 0 ? Math.round((diff / delta.prev) * 100) : delta.current > 0 ? 100 : 0;
  const up = diff > 0, down = diff < 0;
  const Icon = up ? TrendUp : down ? TrendDown : Minus;
  const tone = up ? "text-clay-deep bg-clay-tint" : down ? "text-berry bg-berry-tint" : "text-ink-faint bg-paper-2";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[11px] font-bold tabular-nums ${tone}`}
      title="Last 7 days vs the 7 before"
    >
      <Icon size={12} weight="bold" />
      {diff > 0 ? "+" : ""}{pct}%
    </span>
  );
}

// ── Vertical bar chart with a 7/14/30-day window ──────────────────────────────
function ChartCard({
  title, range, data, delta, accent,
}: { title: string; range: Range; data: DayPoint[]; delta: WoW; accent: string }) {
  const sliced = data.slice(-range);
  const total = sliced.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...sliced.map((d) => d.count));
  return (
    <div className="rounded-2xl border-2 border-line bg-cream shadow-hard p-6 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums text-ink leading-none">
              {total.toLocaleString("en-US")}
            </span>
            <span className="font-mono text-[11px] text-ink-faint uppercase tracking-wide">last {range}d</span>
          </p>
        </div>
        <DeltaPill delta={delta} />
      </div>

      <div className="mt-6 flex items-end gap-[3px] sm:gap-1.5 h-40">
        {sliced.map((d, i) => {
          const { day, full } = fmtDay(d.date);
          const pct = (d.count / max) * 100;
          // Thin out x labels on wide windows to avoid clutter.
          const showLabel = range <= 14 || i % 3 === 0;
          return (
            <div key={d.date} className="group relative flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full z-10
                opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="whitespace-nowrap rounded-lg bg-ink text-cream px-2 py-1 font-mono text-[10px] font-bold shadow-hard-sm">
                  {d.count} · {full}
                </div>
              </div>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.02, type: "spring", stiffness: 140, damping: 18 }}
                style={{ height: `${Math.max(pct, d.count > 0 ? 3 : 1.5)}%`, transformOrigin: "bottom" }}
                className={`w-full rounded-md ${d.count > 0 ? accent : "bg-line"} group-hover:brightness-105`}
              />
              <span className="font-mono text-[9px] text-ink-faint tabular-nums h-2.5">{showLabel ? day : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Horizontal ranked bar ─────────────────────────────────────────────────────
function RankedBar({
  label, value, max, index, accent,
}: { label: string; value: number; max: number; index: number; accent: string }) {
  const pct = (value / Math.max(1, max)) * 100;
  return (
    <li className="flex items-center gap-3">
      <span className="w-28 sm:w-36 shrink-0 truncate text-sm font-semibold text-ink capitalize" title={label}>
        {label}
      </span>
      <div className="flex-1 h-6 rounded-lg bg-paper-2 border-2 border-line overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, value > 0 ? 6 : 0)}%` }}
          transition={{ delay: index * 0.04, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full ${accent}`}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-ink">{value}</span>
    </li>
  );
}

// ── Top learners leaderboard ──────────────────────────────────────────────────
const RANK_TONE = ["text-sun", "text-ink-soft", "text-clay-deep"]; // gold / silver / bronze-ish

function Leaderboard({ learners }: { learners: AdminStats["topLearners"] }) {
  return (
    <div className="rounded-2xl border-2 border-line bg-cream shadow-hard p-6">
      <SectionHead title="Top learners" sub="By XP" />
      {learners.length === 0 ? (
        <Empty>No learners yet.</Empty>
      ) : (
        <ul className="mt-5 divide-y-2 divide-line">
          {learners.map((u, i) => {
            const who = u.name?.trim() || u.email.split("@")[0];
            return (
              <li key={u.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                <span className="w-7 shrink-0 grid place-items-center">
                  {i < 3 ? (
                    <Crown size={18} weight="fill" className={RANK_TONE[i]} />
                  ) : (
                    <span className="font-mono text-sm font-bold text-ink-faint tabular-nums">{i + 1}</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{who}</p>
                  <p className="font-mono text-[11px] text-ink-faint truncate">{u.email}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-sun-tint px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
                  L{u.level}
                </span>
                <span className="shrink-0 w-20 text-right font-mono text-sm font-bold tabular-nums text-ink">
                  {u.xp.toLocaleString("en-US")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Feedback feed: filter + search + CSV export ───────────────────────────────
const CAT_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  idea: { label: "Idea", icon: Lightbulb, cls: "bg-teal-tint text-teal-deep" },
  bug: { label: "Bug", icon: Bug, cls: "bg-berry-tint text-berry" },
  other: { label: "Other", icon: ChatCircleDots, cls: "bg-paper-2 text-ink-soft" },
};

type Filter = "all" | "idea" | "bug" | "other";

function normCat(c: string): Exclude<Filter, "all"> {
  return c === "bug" || c === "other" ? c : "idea";
}

function FeedbackFeed({
  items, counts,
}: {
  items: AdminStats["recentFeedback"];
  counts: AdminStats["feedbackCounts"];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((f) => {
      if (filter !== "all" && normCat(f.category) !== filter) return false;
      if (!needle) return true;
      return (
        f.message.toLowerCase().includes(needle) ||
        (f.email?.toLowerCase().includes(needle) ?? false) ||
        (f.name?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [items, filter, q]);

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["date_utc", "category", "name", "email", "message"],
      ...filtered.map((f) => [
        fmtStamp(f.createdAt),
        f.category,
        f.name ?? "",
        f.email ?? "",
        f.message,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => esc(String(c))).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `beacon-feedback-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.total },
    { id: "idea", label: "Ideas", count: counts.idea },
    { id: "bug", label: "Bugs", count: counts.bug },
    { id: "other", label: "Other", count: counts.other },
  ];

  return (
    <div className="rounded-2xl border-2 border-line bg-cream shadow-hard p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Recent feedback" sub={`Showing ${filtered.length}`} />
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-line bg-paper px-3 h-9 text-sm
            font-semibold text-ink-soft hover:text-ink hover:bg-paper-2 active:scale-[0.97] transition
            disabled:opacity-40 disabled:pointer-events-none"
        >
          <DownloadSimple size={15} weight="bold" />
          Export CSV
        </button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 h-9 text-sm font-semibold transition-colors active:scale-[0.97] ${
                  active
                    ? "bg-clay text-cream border-line shadow-hard-sm"
                    : "bg-paper text-ink-soft border-line hover:text-ink hover:bg-paper-2"
                }`}
              >
                {c.label}
                <span className={`font-mono text-[11px] tabular-nums ${active ? "text-cream/80" : "text-ink-faint"}`}>
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
        <label className="relative sm:ml-auto sm:w-56">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search feedback"
            className="w-full rounded-xl border-2 border-line bg-paper pl-9 pr-3 h-9 text-sm text-ink
              placeholder:text-ink-faint focus:outline-none focus:border-clay"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          {items.length === 0
            ? "No feedback yet — it'll show up here the moment someone writes in."
            : "Nothing matches those filters."}
        </Empty>
      ) : (
        <ul className="mt-5 divide-y-2 divide-line">
          {filtered.map((f) => {
            const meta = CAT_META[normCat(f.category)];
            const Icon = meta.icon;
            const who = f.name?.trim() || f.email || "Deleted account";
            return (
              <li key={f.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-3">
                <span className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 ${meta.cls}`}>
                  <Icon size={15} weight="fill" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap break-words">{f.message}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-ink-faint">
                    <span className="truncate max-w-[18ch] sm:max-w-[28ch]">{who}</span>
                    <span aria-hidden>·</span>
                    <span>{fmtStamp(f.createdAt)}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
