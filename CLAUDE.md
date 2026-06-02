@AGENTS.md

# Beacon — project guide

AI-generated, gamified micro-learning app. Next.js 16 (App Router, Turbopack) +
React 19, Prisma 6 + Postgres, Gemini (Google Generative AI) for generation, Tailwind v4, Framer Motion.

## Architecture

- **Server Components by default.** Add `"use client"` only to interactive leaf
  components. Pages that read per-user data use `export const dynamic = "force-dynamic"`.
- **Data access lives in `lib/`** — `lib/queries.ts` (dashboard/profile),
  `lib/admin.ts` (admin stats + gating), `lib/xp.ts`, `lib/streak.ts`,
  `lib/auth.ts`, `lib/ai.ts` (Gemini generation + prompt builders).
  Pages/route handlers call these; they don't query Prisma inline.
- **Auth**: JWT in an httpOnly cookie (`beacon_token`). `getUser()` resolves the
  current `User | null`. It intentionally lets DB errors propagate (returning
  `null` on a real error would cause an infinite login redirect loop).
- **Admin**: gated by the `ADMIN_EMAILS` env allowlist via `isAdmin(email)` /
  `requireAdmin()` — no role column in the DB. Non-admins are redirected away.

## AI generation (Gemini)

- **Model**: `gemini-3.1-flash-lite` for both path generation and chat
  (`GEN_MODEL` / `CHAT_MODEL` constants in `lib/ai.ts`). API key: `GEMINI_API_KEY`.
- **Progressive phase generation**: only Phase 1 is generated at path creation
  (`POST /api/paths/generate`, ~15–20 s). Subsequent phases are generated in the
  background after the user completes the second-to-last lesson of the current
  phase. The trigger fires from `LessonExperience.submit()` as a fire-and-forget
  `fetch` to `POST /api/phases/[pathId]/generate`.
- **`/api/phases/[pathId]/generate` is idempotent** — if the phase already exists
  in the DB it returns `{ ok: true }` immediately, so double-calls (background
  prefetch + fallback on phase-complete screen) are harmless.
- **Phase visibility**: a phase's lessons are only accessible when the user has
  completed all lessons in the previous phase. Ungenerated and locked phases both
  render as a locked placeholder row ("Unlocks after Phase N−1").
- **`extractFirstJsonObject`** in `lib/ai.ts`: walks the raw response char-by-char
  tracking brace depth and string state to strip any trailing content Gemini appends
  after the JSON object. Do not replace this with `lastIndexOf("}")` — it breaks
  when the JSON body itself contains `}` inside string values.
- **`withRetry`**: retries on HTTP 429 (rate-limited) and 503 (high demand) with
  2 s × attempt backoff. Both generate routes use it.
- **`responseMimeType: "application/json"`** is set on generation calls to nudge
  Gemini toward clean JSON output. Chat uses `startChat({ history })` +
  `sendMessageStream`; role `"assistant"` must be mapped to `"model"` for Gemini.

## Database workflow

- Uses **`prisma db push`** — there is **no `migrations/` folder**. Edit
  `prisma/schema.prisma`, then `npx prisma db push`. `prisma generate` runs on
  `postinstall`.
- The dev and prod apps share the same database, so a `db push` takes effect in
  production too. Adding a table or a nullable column is non-destructive; flag
  anything that could drop data before running it.
- `LearningPath` has a `totalPhases Int @default(1)` column (added for progressive
  generation). `Lesson.phaseNumber` tracks which phase a lesson belongs to.
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
