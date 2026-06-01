# Beacon

AI-generated, gamified micro-learning paths for any skill. Tell Beacon what you
want to learn and it builds a structured path of bite-sized lessons — concept
cards, analogies, code snippets and quizzes — then keeps you coming back with
XP, levels, streaks and achievements.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** — Server Components by
  default, `"use client"` only on interactive leaves.
- **Prisma 6** + **PostgreSQL** (Neon / Vercel Postgres).
- **Groq SDK** — generates the learning paths and lessons.
- **Tailwind CSS v4** (`@theme inline` tokens) — Duolingo-style hard shadows.
- **Framer Motion 12** for motion, **@phosphor-icons/react** for icons.
- **JWT** in an httpOnly cookie (`beacon_token`) + **bcrypt** for auth.
- **Resend** for streak-reminder emails, driven by a cron endpoint.

## Getting started

```bash
npm install            # runs `prisma generate` via postinstall
cp .env.example .env   # then fill in the values below
npx prisma db push     # sync the schema to your database
npm run dev            # http://localhost:3000
```

### Environment variables

| Variable              | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`        | Pooled Postgres URL (the `prisma` connection string).          |
| `DIRECT_URL`          | Direct (non-pooled) URL — used by `prisma db push`.            |
| `GROQ_API_KEY`        | Groq API key for path/lesson generation.                       |
| `JWT_SECRET`          | 32+ char secret for signing session tokens.                    |
| `RESEND_API_KEY`      | Resend key for streak reminder emails.                         |
| `NEXT_PUBLIC_APP_URL` | Base URL (`http://localhost:3000` in dev).                     |
| `CRON_SECRET`         | Shared secret protecting the cron endpoint.                    |
| `ADMIN_EMAILS`        | Comma-separated emails allowed to open `/admin`.               |

## Features

- **Path generation** — describe a skill, level and time budget; Groq returns a
  multi-phase path that's cached in `LearningPath.rawJson`.
- **Lessons** — six lesson types (concept card, analogy, code snippet, myth vs
  reality, did-you-know, flashcard) each with a quiz.
- **Gamification** — XP and levels (`lib/xp.ts`), daily streaks (`lib/streak.ts`),
  bonus XP for multiple lessons a day, and unlockable achievements.
- **Profile** (`/profile`) — streak / level / total XP, account deletion, and a
  feedback form for sending ideas, bug reports or other notes.
- **Admin dashboard** (`/admin`) — gated by `ADMIN_EMAILS`. Platform KPIs,
  engagement metrics, 7/14/30-day signup and lesson-completion trends with
  week-over-week deltas, top skills, learner-level distribution, a top-learners
  leaderboard, and a searchable feedback feed with CSV export.

## Database

This project uses **`prisma db push`** — there is **no `migrations/` folder**.
After editing `prisma/schema.prisma`, run `npx prisma db push` to sync. Adding a
table or nullable column is non-destructive. `prisma generate` runs
automatically on `npm install` (postinstall).

## Scripts

```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Deploying

Deploys to Vercel. Set every variable from the table above in the project
settings (including `ADMIN_EMAILS` for admin access). The schema is shared with
the production database, so run `npx prisma db push` against it when the schema
changes.
