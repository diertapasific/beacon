@AGENTS.md

# Beacon — project guide

AI-generated, gamified micro-learning app. Next.js 16 (App Router, Turbopack) +
React 19, Prisma 6 + Postgres, Groq for generation, Tailwind v4, Framer Motion.

## Architecture

- **Server Components by default.** Add `"use client"` only to interactive leaf
  components. Pages that read per-user data use `export const dynamic = "force-dynamic"`.
- **Data access lives in `lib/`** — `lib/queries.ts` (dashboard/profile),
  `lib/admin.ts` (admin stats + gating), `lib/xp.ts`, `lib/streak.ts`,
  `lib/auth.ts`. Pages/route handlers call these; they don't query Prisma inline.
- **Auth**: JWT in an httpOnly cookie (`beacon_token`). `getUser()` resolves the
  current `User | null`. It intentionally lets DB errors propagate (returning
  `null` on a real error would cause an infinite login redirect loop).
- **Admin**: gated by the `ADMIN_EMAILS` env allowlist via `isAdmin(email)` /
  `requireAdmin()` — no role column in the DB. Non-admins are redirected away.

## Database workflow

- Uses **`prisma db push`** — there is **no `migrations/` folder**. Edit
  `prisma/schema.prisma`, then `npx prisma db push`. `prisma generate` runs on
  `postinstall`.
- The dev and prod apps share the same database, so a `db push` takes effect in
  production too. Adding a table or a nullable column is non-destructive; flag
  anything that could drop data before running it.
- Prefer `onDelete: SetNull` over `Cascade` for records worth keeping after a
  user is deleted (e.g. `Feedback`).
- **Restart `next dev` after any schema change.** A running dev server caches
  the generated Prisma client in memory, so a new field reads back as
  `undefined` and writes to it are silently rejected until you restart.

## Conventions

- **Hydration safety [important].** Never call `new Date()` (or anything
  locale/timezone-dependent) during render in a way that differs between server
  (UTC on Vercel) and browser — it triggers React #418 in prod but is invisible
  in `next dev`. Resolve time-of-day greetings post-mount in `useEffect`; pin all
  date/number formatting to `toLocaleString("en-US", { ..., timeZone: "UTC" })`,
  or parse `"YYYY-MM-DD"` strings by splitting rather than constructing a `Date`.
- **Design system** (Tailwind v4 tokens in `app/globals.css`): surfaces
  `bg-paper`/`bg-cream`, text `text-ink`/`text-ink-soft`/`text-ink-faint`,
  borders `border-line`. Accents: `clay` (orange, primary), `teal` (blue, info),
  `sun` (yellow, XP), `berry` (red, errors/danger), `streak` (orange). Opacity
  modifiers and `*-tint` variants exist. Hard shadows: `shadow-hard`,
  `shadow-hard-sm`, `shadow-hard-clay`; `press`/`press-clay` for tactile buttons.
  Numbers use `font-mono tabular-nums`.
- **Icons**: `@phosphor-icons/react` only. **No emojis** anywhere.
- **`Button`** (`components/ui/Button.tsx`) variants: `primary | secondary | ghost`,
  sizes `md | lg`. There is no `danger`/`outline` variant — destructive actions
  are styled inline with `berry`.
- **Avoid new dependencies.** Charts and CSV export are hand-rolled with
  SVG/CSS — check `package.json` before importing anything new.

## After making changes

Run `npx tsc --noEmit` and `npx eslint <files>` before reporting done.
