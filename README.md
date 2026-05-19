# Interview Coach

Interview Coach is a private practice app for preparing technical and behavioral interview answers. It helps you browse a structured question bank, review concept notes and story scripts, check in after practice, track confidence, and keep a daily practice streak.

The app is built with Next.js, React, and Supabase. Without Supabase credentials, it can still run locally in demo mode using browser local storage.

## Features

- Today dashboard with streak, daily practice quest, heatmap, and suggested questions
- Question bank grouped by track with search and status stamps
- Question detail pages for concept answers and behavioral story practice
- Practice check-ins with result, confidence, note history, and stamp animation
- Streaks page with review heatmap, weekly progress, milestones, and recent stamps
- Optional Supabase persistence for private cloud sync

## Requirements

- Node.js 20 or newer
- npm
- Optional: a Supabase project for cloud persistence

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

For local demo mode, you can leave the Supabase values blank. The app will store demo questions and practice history in browser local storage.

To use Supabase locally, fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SEED_USER_ID=
```

Then run the SQL in `supabase/schema.sql` in your Supabase SQL editor. If you use the seed script, `SEED_USER_ID` should be the Supabase Auth user ID that owns the imported questions.

## Run Locally

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If port 3000 is already in use, Next.js may choose another port. You can also choose one explicitly:

```bash
npm run dev -- -p 3001
```

## Optional: Seed Supabase

If Supabase is configured and you have local source files available, import the question bank:

```bash
npm run seed
```

The seed script upserts questions by owner and source ID so it can be run more than once without duplicating records.

## Useful Commands

Run a production build:

```bash
npm run build
```

Run TypeScript checks:

```bash
npm run typecheck
```

Start a production server after building:

```bash
npm run start
```
