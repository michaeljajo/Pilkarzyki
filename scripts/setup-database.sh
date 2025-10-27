#!/bin/bash

# Fantasy Football Database Setup Script
echo "🏈 Setting up Fantasy Football Database"

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   NEXT_PUBLIC_SUPABASE_URL"
    echo "   SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Please set these in your .env.local file"
    exit 1
fi

echo "✅ Environment variables found"

# Install Supabase CLI if not already installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "🗄️  Running database schema..."

# Apply schema
psql "$DATABASE_URL" -f supabase/schema.sql

echo "🔒 Applying Row Level Security policies..."

# Apply RLS policies
psql "$DATABASE_URL" -f supabase/rls-policies.sql

echo "🧪 Running database connectivity test..."

# Test database setup
npx tsx scripts/test-database.ts

echo "🎉 Database setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure Clerk webhook endpoint in your Clerk dashboard:"
echo "   URL: https://pilkarzyki-michaels-projects-3c70005d.vercel.app/api/webhooks/clerk"
echo "2. Add CLERK_WEBHOOK_SECRET to your environment variables"
echo "3. Test user creation by signing up through your app"