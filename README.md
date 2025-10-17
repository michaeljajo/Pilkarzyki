# Fantasy Football Draft App

A modern fantasy football management system built with Next.js 14, Clerk authentication, Supabase backend, and deployed on Vercel.

## Features

- **User Authentication**: Secure authentication with Clerk
- **League Management**: Create and manage fantasy football leagues
- **Squad Management**: Excel-based squad assignment with Manager column
- **Weekly Lineups**: Select 3 players per gameweek with validation rules
- **Automated Scheduling**: Double round-robin scheduling for up to 16 managers
- **Scoring System**: Goal-based scoring with league table standings
- **Real-time Updates**: Live data sync with Supabase

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Backend**: Supabase (PostgreSQL, Real-time, RLS)
- **Deployment**: Vercel

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_postgresql_connection_string
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fantasy-football
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Clerk and Supabase credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Deployment on Vercel

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

The app is configured for optimal performance on Vercel with:
- Serverless functions for API routes
- Static generation for public pages
- Edge runtime for authentication middleware

## Project Structure

```
src/
├── app/
│   ├── dashboard/         # Protected dashboard pages
│   ├── sign-in/          # Authentication pages
│   ├── sign-up/
│   └── layout.tsx        # Root layout with ClerkProvider
├── lib/
│   ├── supabase.ts       # Supabase client configuration
│   ├── supabase-client.ts # Client-side Supabase with Clerk
│   └── supabase-server.ts # Server-side Supabase with Clerk
└── middleware.ts         # Clerk authentication middleware
```

## Admin Features

- User management and role assignment
- Excel squad import (Name, Surname, League, Position, Manager)
- Gameweek calendar setup (30 gameweeks)
- Results entry and scoring management

## Manager Features

- View assigned squad
- Weekly lineup selection with validation
- League standings and results
- Real-time updates during gameweeks
