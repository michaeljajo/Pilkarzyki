/**
 * One-off backfill: replace fabricated placeholder identities in the `users`
 * mirror with the real Clerk profile.
 *
 * Older code paths (set-admin, getOrCreateUser, league creation) used to write
 * placeholder rows — first_name "Admin"/"User", last_name "User"/"Account",
 * email "<prefix>-<clerkId>@temp.com" — instead of the person's real Clerk
 * data. Those writers are now fixed, but rows created before the fix still hold
 * the junk. This script finds every `@temp.com` row, looks the user up in Clerk
 * by clerk_id, and writes back their real email + resolved name.
 *
 * Read paths already hide the placeholder at display time, so this is optional
 * cleanup — but it fixes the data at the source so no runtime resolution is
 * needed.
 *
 * Usage:  npx tsx scripts/backfill-temp-emails.ts          (dry run — shows changes)
 *         npx tsx scripts/backfill-temp-emails.ts --apply  (writes the updates)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and
 * CLERK_SECRET_KEY (loaded here from .env.local).
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { createClerkClient } from '@clerk/backend'
import { resolveUserNames } from '../src/utils/name-resolver'

const APPLY = process.argv.includes('--apply')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

async function backfill() {
  console.log(`🔍 Finding users with placeholder @temp.com emails${APPLY ? '' : ' (dry run)'}...`)

  const { data: users, error } = await supabase
    .from('users')
    .select('id, clerk_id, email, first_name, last_name')
    .like('email', '%@temp.com')

  if (error) {
    console.error('❌ Error fetching users:', error)
    process.exit(1)
  }

  console.log(`📊 Found ${users?.length || 0} placeholder rows\n`)

  let fixed = 0
  let skipped = 0

  for (const user of users || []) {
    if (!user.clerk_id) {
      console.warn(`⚠️  ${user.email}: no clerk_id, cannot resolve — skipping`)
      skipped++
      continue
    }

    try {
      const clerkUser = await clerk.users.getUser(user.clerk_id)
      const email = clerkUser.emailAddresses[0]?.emailAddress || ''

      if (!email) {
        console.warn(`⚠️  ${user.email}: Clerk user has no email — skipping`)
        skipped++
        continue
      }

      const { firstName, lastName } = resolveUserNames({
        email,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        username: clerkUser.username,
      })

      console.log(`🔄 ${user.clerk_id}`)
      console.log(`   email: ${user.email} → ${email}`)
      console.log(`   name:  ${user.first_name} ${user.last_name} → ${firstName} ${lastName}`)

      if (APPLY) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ email, first_name: firstName, last_name: lastName })
          .eq('id', user.id)

        if (updateError) {
          console.error(`   ❌ update failed:`, updateError.message)
          skipped++
          continue
        }
        console.log('   ✅ updated')
      }
      fixed++
    } catch (err) {
      console.warn(`⚠️  ${user.email}: Clerk lookup failed — skipping`, err instanceof Error ? err.message : err)
      skipped++
    }
  }

  console.log(`\n✨ Done. ${APPLY ? 'Updated' : 'Would update'} ${fixed}, skipped ${skipped}.`)
  if (!APPLY && fixed > 0) {
    console.log('   Re-run with --apply to write these changes.')
  }
}

backfill().catch((err) => {
  console.error(err)
  process.exit(1)
})
