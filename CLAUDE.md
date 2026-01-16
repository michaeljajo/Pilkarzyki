# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Always refer to @RULES.md and apply rules which are listed there.

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack for faster builds)
  - Includes auto-cleanup script that prevents port conflicts and middleware/proxy cache issues
  - Automatically detects and removes stale Next.js 16 middleware cache from pre-migration builds
- **Build**: `npm run build` (production build with Turbopack)
- **Start**: `npm start` (production server)
- **Lint**: `npm run lint` (ESLint)

### Important Notes
- **Next.js 16 Migration**: This project uses `proxy.ts` (not `middleware.ts`) for route handling
- **Auto-cleanup**: The dev script automatically cleans stale caches and kills orphaned processes
- **If localhost not responding**: The auto-cleanup should handle it, but manually run `rm -rf .next` if needed

## Architecture Overview

This is a fantasy football management application built with Next.js 15, featuring:

### Authentication & Authorization
- **Clerk** for user authentication with middleware protection
- Routes are protected by default except: `/`, `/sign-in/*`, `/sign-up/*`, `/api/webhooks/*`
- Middleware at root level handles auth routing

### Database Architecture
- **Supabase** PostgreSQL backend with three client configurations:
  - `src/lib/supabase.ts`: Basic client and admin client
  - `src/lib/supabase-client.ts`: Client-side with Clerk auth integration
  - `src/lib/supabase-server.ts`: Server-side with Clerk auth integration
- Clerk tokens are passed as Authorization headers to Supabase for RLS

### Core Data Models
Key entities defined in `src/types/index.ts`:
- **User**: Clerk ID integration with admin roles
- **League**: Season management with gameweek tracking
- **Player**: Squad members with position/manager assignment
- **Squad**: Manager's player collections
- **Lineup**: Weekly team selections (3 players max)
- **Gameweek**: Time-based periods with lock dates
- **Match**: Head-to-head fixtures between managers
- **Result**: Player goal scoring data

### Application Structure
- **App Router** with TypeScript
- **Protected routes** under `/dashboard/*`
- **Clerk auth pages** at `/sign-in` and `/sign-up`
- **Root layout** wraps app in ClerkProvider
- **Tailwind CSS** for styling with Geist fonts

### Key Business Logic
- **Squad Management**: Excel import for player assignment to managers
- **Lineup Validation**: 3-player limit per gameweek with position rules
- **Scoring System**: Goal-based with automated league standings
- **Scheduling**: Double round-robin for up to 16 managers
- **Real-time Updates**: Live sync via Supabase subscriptions

### Deployment Configuration
- **Vercel** optimized with `vercel.json`
- **Regional deployment**: Frankfurt (fra1)
- **Function timeout**: 30 seconds for API routes
- **Turbopack** for faster development and builds

## Environment Variables Required

```bash
# Clerk Authentication
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

## Development Notes

- Use appropriate Supabase client based on context (client/server/admin)
- All database operations should respect Clerk user context
- TypeScript interfaces are comprehensive - reference `src/types/index.ts`
- Authentication is handled at middleware level, not component level
- Position types are strictly enforced: 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'