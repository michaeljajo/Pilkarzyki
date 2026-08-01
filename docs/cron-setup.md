# Vercel Cron Job Setup Guide

## Problem Solved
Gameweeks were not completing automatically because the Vercel cron job was not properly configured.

## What Was Done
1. ✅ Manually completed 21 expired gameweeks (including gameweek 14 from December 22nd)
2. ✅ Cron job code exists in `/src/app/api/cron/complete-gameweeks/route.ts`
3. ✅ Cron schedule configured in `vercel.json` to run daily at midnight UTC

## Current Status

✅ **CRON_SECRET exists** in Vercel (value: `pilkarzyki_cron_secret_2025`)
✅ **Cron endpoint works** (tested locally - returns HTTP 200)
❌ **Cron jobs NOT registered** in Vercel (need activation)

## What You Need to Do

### Step 1: Redeploy to Register Cron Jobs
The cron jobs in `vercel.json` need to be registered with Vercel through a fresh deployment:
**Option A: Git Push (Recommended)**
```bash
git add .
git commit -m "Register cron jobs for automatic gameweek completion"
git push origin main
```

**Option B: Vercel CLI**
```bash
vercel --prod
```

### Step 2: Verify Cron Jobs Are Active
1. Go to your Vercel project dashboard
2. Navigate to the "Cron Jobs" tab
3. You should see two cron jobs:
   - **complete-gameweeks**: Runs daily at 00:00 CET (midnight Polish time)
   - **apply-default-lineups**: Runs daily at 00:30 CET (12:30 AM Polish time)

**Important**: If the cron jobs don't appear after deployment:
- Some Vercel plans may have cron jobs disabled by default
- You may need to enable cron jobs in your Vercel project settings
- Contact Vercel support if needed

### Step 3: Monitor Cron Job Execution
After deployment, you can monitor cron job execution:

1. Go to Vercel Dashboard → Your Project → Functions
2. Look for the cron function executions
3. Check the logs to ensure they're running successfully

You can also manually test the cron job by calling the endpoint:

```bash
curl -X GET https://your-domain.vercel.app/api/cron/complete-gameweeks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How It Works

### Automatic Gameweek Completion
- **Schedule**: Daily at midnight UTC (00:00)
- **Endpoint**: `/api/cron/complete-gameweeks`
- **Logic**:
  1. Finds all gameweeks where `end_date < current_time` and `is_completed = false`
  2. Marks each gameweek as completed
  3. Advances the league's `current_gameweek` to the next incomplete gameweek
  4. Logs all actions for monitoring

### Manual Completion (Emergency)
If you ever need to manually complete gameweeks:

**Option 1: Run the script (recommended for development)**
```bash
npm exec -- tsx scripts/manually-complete-gameweeks.ts
```

**Option 2: Call the admin API endpoint**
```bash
curl -X POST https://your-domain.vercel.app/api/admin/complete-gameweeks \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

## Troubleshooting

### Cron jobs not running
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check that you've deployed after setting the environment variable
3. Look for cron execution logs in Vercel dashboard

### Gameweeks not completing
1. Check Vercel function logs for errors
2. Verify gameweek `end_date` values in database are correct
3. Manually run the completion script to fix immediate issues

### Database timezone issues
- All dates in the database should be stored in UTC
- The cron job runs at 23:00 UTC (midnight CET/Polish time)
- During summer (CEST), the job runs at 1:00 AM Polish time
- Make sure gameweek end dates are set correctly in UTC

## Additional Notes
- The cron job also handles advancing the league to the next gameweek automatically
- Failed completions are logged but don't stop the process for other gameweeks
- The same logic is available as an admin endpoint for manual triggering if needed
