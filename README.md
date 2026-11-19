# Roblox Soccer Stats Tracker

A Next.js 16 + React 19 website for tracking a Roblox soccer league. The project includes public pages for players, teams, matches, competitions, rankings, records, transfers, season sheets and arcade-style games, plus an admin dashboard.

## Requirements

- Node.js 20.9 or newer
- PostgreSQL database
- npm

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

   Set `DATABASE_URL` to your PostgreSQL connection string and set a strong `ADMIN_PASSWORD`. Keep `.env.local` private; do not commit it.

3. Create/update the database schema:

   ```bash
   npm run db:push
   ```

4. Seed the starter archive data (only if the database is empty):

   ```bash
   npm run db:seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Production deployment

This is a server-rendered Next.js app and requires a hosted PostgreSQL database. A typical setup is:

1. Push this project to a private or public Git repository.
2. Create a PostgreSQL database with a provider such as Neon, Supabase, or Railway.
3. Import the repository into Vercel (or another Node-compatible Next.js host).
4. Add `DATABASE_URL` and `ADMIN_PASSWORD` as server-side environment variables in the hosting dashboard.
5. Run `npm run db:push` once against the production database, then deploy.
6. Open `/admin/login` to manage the league.

Never expose `DATABASE_URL` or `ADMIN_PASSWORD` in client-side variables (for example, do not prefix them with `NEXT_PUBLIC_`).

## Notes

- The site is database-backed; it is not a standalone static HTML export.
- The archive seed is intended for an empty database. Review imported records before using the tracker as an official source of league results.
- Roblox avatar lookups and Google Sheets sync features may require their corresponding external configuration/access.
