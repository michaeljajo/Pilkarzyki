# Production URL Configuration Guide

## Your New Permanent Production URLs

After renaming your Vercel project from `fantasy-football` to `pilkarzyki`, you now have these permanent production URLs:

### Primary Production URL:
```
https://pilkarzyki-michaels-projects-3c70005d.vercel.app
```

### Alternative URLs (all point to the same deployment):
- `https://pilkarzyki-michaeljajo-michaels-projects-3c70005d.vercel.app`
- `https://fantasy-football-zeta-one.vercel.app` (old URL, still works as alias)

## Required: Update Clerk Dashboard

You **must** update your Clerk configuration to include the new production URL. Follow these steps:

### 1. Update Allowed Domains

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application: **civil-mammal-51**
3. Navigate to **"Settings"** → **"Domains"**
4. Click **"Add Domain"**
5. Add: `pilkarzyki-michaels-projects-3c70005d.vercel.app`
6. Click **"Save"**

### 2. Update Webhook Endpoint (If Configured)

If you have webhooks set up:

1. Go to **"Webhooks"** section in Clerk Dashboard
2. Find your existing webhook or click **"Add Endpoint"**
3. Update the **Endpoint URL** to:
   ```
   https://pilkarzyki-michaels-projects-3c70005d.vercel.app/api/webhooks/clerk
   ```
4. Ensure these events are enabled:
   - ✅ `user.created`
   - ✅ `user.updated`
5. Copy the **Signing Secret** (starts with `whsec_...`)
6. Update your `.env.local` and Vercel environment variables:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### 3. Update Redirect URLs (Already Configured)

Your current Clerk redirect configuration uses relative paths, so no changes needed:
- Sign-in URL: `/sign-in` ✅
- Sign-up URL: `/sign-up` ✅
- After sign-in redirect: `/dashboard` ✅
- After sign-up redirect: `/dashboard` ✅

These work automatically on any domain.

### 4. Update CORS Settings (If Applicable)

If you have CORS configured in Clerk:

1. Go to **"API Keys"** section
2. Check **"CORS Origins"** settings
3. Add: `https://pilkarzyki-michaels-projects-3c70005d.vercel.app`

## Vercel Environment Variables

Make sure your Vercel project has all required environment variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **pilkarzyki**
3. Go to **Settings** → **Environment Variables**
4. Verify these are set:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   CLERK_SECRET_KEY
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   DATABASE_URL
   CLERK_WEBHOOK_SECRET (if using webhooks)
   ```

## Testing Your Setup

After updating Clerk:

1. Visit your production URL:
   ```
   https://pilkarzyki-michaels-projects-3c70005d.vercel.app
   ```

2. Test authentication:
   - Click **Sign In** - should work without errors
   - Try signing in with test account
   - Should redirect to `/dashboard` successfully

3. Test webhook (if configured):
   - Create a new user account
   - Check Clerk Dashboard → Webhooks → Events
   - Should see successful delivery to your endpoint

## Troubleshooting

### "Invalid domain" error when signing in
- Check that you added the domain in Clerk Dashboard → Domains
- Make sure there are no typos in the URL
- Wait 1-2 minutes for Clerk DNS to propagate

### Webhooks not firing
- Verify webhook URL is correct with `/api/webhooks/clerk` path
- Check webhook secret matches in both Clerk and your environment
- Look at Clerk Dashboard → Webhooks → Events for delivery logs

### Authentication redirects to wrong URL
- Your redirect URLs use relative paths, so should work automatically
- If issues persist, check middleware.ts:43 for redirect logic

## What Changed

| Before | After |
|--------|-------|
| Project Name: `fantasy-football` | Project Name: `pilkarzyki` |
| URL: `fantasy-football-zeta-one.vercel.app` | URL: `pilkarzyki-michaels-projects-3c70005d.vercel.app` |
| - | Old URL still works as alias |

## Notes

- The old URL (`fantasy-football-zeta-one.vercel.app`) still works as an alias
- All deployment URLs now start with `pilkarzyki-` instead of `fantasy-football-`
- Your permanent production URL never changes unless you rename the project again
- Consider adding a custom domain (e.g., `pilkarzyki.com`) for a cleaner URL

## Next Steps

1. ✅ Update Clerk Dashboard domains (required)
2. ✅ Update webhook endpoint if using webhooks
3. ✅ Test authentication on production URL
4. ⏭️ Consider adding a custom domain for better branding
