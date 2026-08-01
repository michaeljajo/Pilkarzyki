# Piłkarzyki

Fantasy football management for a private league: squads, weekly lineups,
a league season and a cup competition running alongside it, plus a live draft.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack in dev)
- **Clerk** for authentication
- **Supabase** (PostgreSQL + RLS) for data
- **Tailwind CSS v4**
- **Vercel** for hosting (Frankfurt, `fra1`)

Routing note: this project uses `src/proxy.ts` for middleware, not
`middleware.ts` — that is the Next 16 convention.

## Local setup (macOS)

```bash
npm install
```

Create `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

Then:

```bash
npm run dev
```

> The checkout currently lives inside iCloud Drive, which causes sync conflict
> copies and phantom file changes in `node_modules`. Moving it somewhere local
> (e.g. `~/Developer`) is recommended — see `docs/dev-server.md`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | dev server on :3000 (cleans up stale state first) |
| `npm run build` | production build — type-checks, and fails on type errors |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src` and `scripts` |
| `npm run kill:dev` | free port 3000 |
| `npm run dev:emergency` | last-resort cleanup for a wedged dev server |

Do not run `npm run build` while `npm run dev` is live — both write `.next`.

## Deployment

Push to `main`; Vercel builds and deploys. Environment variables are set in the
Vercel dashboard. `vercel.json` pins the region, sets a 30s function timeout for
API routes, and registers two cron jobs (gameweek completion at 23:00, default
lineups at 23:30).

Test on the Vercel preview URL, not only locally — the build environment
differs from macOS.

## Layout

```
src/
├── app/                 # App Router pages and 90+ API routes
│   ├── leagues/[id]/    # league, cup, squad, draft, and /manage admin mode
│   └── api/
├── components/
├── lib/                 # supabase clients, auth-helpers, domain services
├── utils/               # scheduling, standings, validation, parsers
├── types/               # shared TypeScript interfaces
└── proxy.ts             # Clerk middleware (Next 16 naming)
```

Three Supabase clients, chosen by context: `lib/supabase.ts` (anon + admin),
`lib/supabase-client.ts` (browser, Clerk-authed), `lib/supabase-server.ts`
(server, Clerk-authed). The admin client bypasses RLS — every route using it
must authorize explicitly via `lib/auth-helpers.ts`.

## Docs

| File | Contents |
|---|---|
| `docs/dev-server.md` | running and unwedging the dev server |
| `docs/database-setup.md` | initial database setup |
| `docs/database-triggers.md` | rules enforced in Postgres, not app code |
| `docs/deployment.md` | deploy process |
| `docs/cron-setup.md` | scheduled jobs |
| `docs/webhooks.md` | Clerk webhook setup |
| `docs/league-data-safeguards.md` | league data integrity |
| `docs/league-isolation-safeguards.md` | cross-league isolation |
| `docs/mid-season-draft.md` | mid-season draft feature |
| `supabase/migrations/README.md` | migration order, collisions, conventions |

`CLAUDE.md` and `RULES.md` are instructions for AI coding agents.
