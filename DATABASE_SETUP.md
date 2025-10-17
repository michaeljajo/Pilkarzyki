# Database Setup Guide - Phase 1

## 🎯 What We've Built

**Phase 1: Database Foundation** is now complete! Here's what's been implemented:

### ✅ Database Schema
- **9 core tables** with proper relationships and constraints
- **UUID primary keys** with PostgreSQL extensions
- **Comprehensive indexes** for performance
- **Auto-updating timestamps** with triggers
- **Position validation** and array constraints

### ✅ Row Level Security (RLS)
- **Clerk integration** via JWT token parsing
- **Admin/Manager role separation** with proper permissions
- **Secure API access** with authenticated requests only
- **Helper functions** for user identification and admin checks

### ✅ API Routes
- **Full CRUD operations** for users, leagues, and players
- **Bulk import endpoint** for Excel/CSV player data
- **Proper error handling** and TypeScript typing
- **Clerk authentication** on all endpoints

### ✅ Database Utilities
- **Testing and seeding** functions for development
- **Connection verification** and health checks
- **Data cleanup** utilities for test environments
- **Table count monitoring** for debugging

### ✅ Clerk Integration
- **Webhook endpoint** for automatic user sync
- **User creation/update/deletion** handling
- **Admin role management** via public metadata

---

## 🚀 How to Set Up

### Option 1: Manual Setup

1. **Apply the database schema:**
   ```sql
   -- Run in your Supabase SQL editor or psql
   \i supabase/schema.sql
   \i supabase/rls-policies.sql
   ```

2. **Test the setup:**
   ```bash
   npx tsx scripts/test-database.ts
   ```

### Option 2: Automated Setup

```bash
# Make sure your .env.local has the required variables
./scripts/setup-database.sh
```

### Required Environment Variables

Add these to your `.env.local`:

```bash
# Existing Supabase vars
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_postgresql_connection_string

# New: Clerk webhook (optional for now)
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

---

## 🧪 Testing

### API Endpoints Available

**Users:**
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

**Leagues:**
- `GET /api/leagues` - List active leagues
- `POST /api/leagues` - Create league

**Players:**
- `GET /api/players` - List players (supports ?managerId and ?league filters)
- `POST /api/players` - Create single player
- `PUT /api/players` - Bulk import players

**Webhook:**
- `POST /api/webhooks/clerk` - Clerk user sync

### Quick Test with curl

```bash
# Test user creation (replace with your actual Clerk user ID)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "clerkId": "your_clerk_user_id",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }'
```

---

## 📊 Database Schema Overview

```
users (auth integration)
├── leagues (admin creates)
│   ├── gameweeks (30 per season)
│   │   ├── matches (head-to-head)
│   │   ├── lineups (manager selections)
│   │   └── results (player performances)
│   └── standings (calculated rankings)
└── players (imported from Excel)
    └── squads (assigned to managers)
```

---

## 🔧 What's Next

Phase 1 provides the **foundation** for all other features. With this in place, we can now build:

- **Phase 2**: Admin dashboard and user management UI
- **Phase 3**: Manager dashboard and squad viewing
- **Phase 4**: Lineup selection and gameweek system
- **Phase 5**: Scoring and match results
- **Phase 6**: Polish and advanced features

---

## 🐛 Troubleshooting

**Connection Issues:**
- Verify `.env.local` variables are correct
- Check Supabase project is active and accessible
- Ensure RLS policies allow your user to access data

**Webhook Issues:**
- Clerk webhook secret must match dashboard configuration
- Webhook URL should be `https://your-domain/api/webhooks/clerk`
- Check Clerk dashboard for webhook delivery logs

**Permission Errors:**
- Ensure your user has `is_admin` set to true for admin operations
- Check RLS policies are correctly identifying your Clerk user ID
- Verify JWT token template is configured in Clerk

---

## 📝 Notes

- **All tables use UUIDs** for better security and scalability
- **RLS policies** automatically filter data based on user roles
- **API routes** handle both individual and bulk operations
- **Database utilities** support testing and development workflows
- **Clerk integration** keeps users synchronized automatically

The database foundation is now solid and ready for building the fantasy football features! 🏈