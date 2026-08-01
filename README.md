# Cyber BU Console

Lightweight leads/deals/closures tracker for the Cybersecurity BU: pipeline board, quick entry, and a leadership dashboard.

## Local development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx tsx prisma/seed.ts   # optional: load sample data
npm run dev
```

Copy `.env.example` to `.env` first. For local dev, the default `DATABASE_URL="file:./dev.db"` is enough — no Turso account needed.

## Deploying

1. **Database (Turso)** — create a database at [turso.tech](https://turso.tech), grab its `libsql://...` URL and an auth token.
2. **Push the schema** to that database once, from your machine:
   ```bash
   DATABASE_URL="libsql://<your-db>.turso.io" TURSO_AUTH_TOKEN="<token>" npx prisma migrate deploy
   ```
   (On Windows PowerShell, set each with `$env:DATABASE_URL = "..."` on its own line first.)
3. **Hosting (Vercel)** — import this repo at [vercel.com/new](https://vercel.com/new), then in Project Settings → Environment Variables add:
   - `DATABASE_URL` = your Turso `libsql://...` URL
   - `TURSO_AUTH_TOKEN` = your Turso token
4. Every push to `main` redeploys automatically once the repo is connected.

## Stack

Next.js 16 (App Router, Server Actions) · Tailwind v4 · Prisma 7 (`prisma-client` generator, libSQL driver adapter) · Recharts.
