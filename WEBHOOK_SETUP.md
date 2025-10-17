# Clerk Webhook Setup Instructions

## Current Status
❌ **Webhooks Not Configured** - Currently using placeholder webhook secret

## Why This Matters
Without proper webhook configuration:
- New users with usernames won't automatically get their names processed
- Manual "Run Name Migration" required each time
- **User duplicates may appear** in admin interface (now automatically handled)

## Setup Steps

### 1. Access Clerk Dashboard
- Go to [clerk.com](https://clerk.com) and sign in
- Navigate to your project: **civil-mammal-51** (based on your publishable key)

### 2. Configure Webhook Endpoint
1. In Clerk Dashboard, go to **"Webhooks"** section
2. Click **"Add Endpoint"**
3. Set **Endpoint URL** to:
   ```
   https://your-app-domain.com/api/webhooks/clerk
   ```
   (Replace with your actual deployed domain)

### 3. Select Events
Enable these webhook events:
- ✅ **user.created** - When new users sign up
- ✅ **user.updated** - When users update their profiles

### 4. Get Webhook Secret
1. After creating the webhook, Clerk will provide a **"Signing Secret"**
2. Copy this secret (starts with `whsec_...`)

### 5. Update Environment Variables
Replace the placeholder in `.env.local`:
```bash
# Replace this:
CLERK_WEBHOOK_SECRET=temp_placeholder

# With your real secret:
CLERK_WEBHOOK_SECRET=whsec_your_real_secret_here
```

### 6. Test the Webhook
1. Restart your development server
2. Create a new user account with a username
3. Check server logs for webhook activity:
   ```
   🚀 Webhook called at: [timestamp]
   🔍 Processing user creation for: [email]
   ✅ User created successfully: [email] ([resolved names])
   ```

## Current Enhanced Features

### ✅ Username Processing Priority
1. **Username** (primary) - "john.doe" → "john" "doe"
2. **First/Last Names** (fallback) - Direct from Clerk
3. **Email Prefix** (last resort) - "john.doe@email.com" → "john.doe"

### ✅ Smart Username Parsing
- **Spaces**: "John Doe" → "John" "Doe"
- **Dots**: "john.doe" → "john" "doe"
- **Single**: "johndoe" → "johndoe" ""

### ✅ Consistent Processing
- Same logic used in both webhook and "Add Manager" flows
- Comprehensive logging for debugging
- Automatic fallbacks ensure no blank names

## Benefits After Setup
- ✅ **No Manual Migration** - New users automatically get proper names
- ✅ **Username Support** - Processes usernames from Clerk sign-up
- ✅ **Real-time Sync** - Names appear immediately in schedules
- ✅ **Robust Fallbacks** - Multiple name sources with smart parsing
- ✅ **Duplicate Prevention** - Prevents future user duplicates at source

## Current Duplicate User Fix
**Status: ✅ Implemented**

The system now automatically handles duplicate users in the admin interface:
- **Detection**: Logs duplicate emails found in Clerk
- **Deduplication**: Automatically selects the best user record based on:
  1. Most recent sign-in activity
  2. Most complete profile (firstName, lastName, username)
  3. Most recent account creation
- **Transparency**: Logs which duplicates are resolved and why
- **Non-destructive**: Only affects display, doesn't delete Clerk records

This provides immediate relief while webhook setup prevents future duplicates.

## Troubleshooting

### No Webhook Activity
- Check webhook URL is correct
- Verify events are enabled (user.created, user.updated)
- Ensure webhook secret is properly set

### Still Getting Blank Names
- Check server logs for webhook processing
- Verify username field is being sent by Clerk
- Run manual migration as temporary fix

### Testing Locally
For local development, use ngrok or similar to expose webhook endpoint:
```bash
ngrok http 3003
# Use the ngrok URL + /api/webhooks/clerk as webhook endpoint
```