# Manual User Setup Instructions

Since the webhook is having issues with Vercel's password protection, here's how to manually create users and make yourself an admin:

## Option 1: Manual Database Insert

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project → Table Editor → `users` table
3. Click "Insert" → "Insert Row"
4. Fill in the values:
   - `clerk_id`: Get this from Clerk Dashboard → Users → find your user → copy the User ID
   - `email`: Your email address
   - `first_name`: Your first name
   - `last_name`: Your last name
   - `is_admin`: `true` (to make yourself admin)
   - `created_at`: Leave as default
   - `updated_at`: Leave as default

## Option 2: SQL Query

Run this SQL query in Supabase SQL Editor:

```sql
INSERT INTO users (clerk_id, email, first_name, last_name, is_admin)
VALUES ('YOUR_CLERK_USER_ID', 'your@email.com', 'Your', 'Name', true);
```

Replace:
- `YOUR_CLERK_USER_ID` with your actual Clerk user ID
- `your@email.com` with your email
- `'Your', 'Name'` with your actual name

## Finding Your Clerk User ID

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to "Users" in the sidebar
3. Find your user account
4. Click on it to view details
5. Copy the "User ID" (starts with `user_`)

After setting up the user manually, you'll be able to access the admin dashboard!