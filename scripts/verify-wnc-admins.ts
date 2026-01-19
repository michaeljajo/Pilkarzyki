/**
 * Verify WNC league admins in the database
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function verifyAdmins() {
  console.log('Verifying WNC league admins...\n')

  // Get WNC league
  const { data: league, error: leagueError } = await supabaseAdmin
    .from('leagues')
    .select('id, name')
    .ilike('name', '%WNC%')
    .single()

  if (leagueError || !league) {
    console.error('❌ Error finding league:', leagueError)
    return
  }

  console.log(`League: ${league.name}`)
  console.log(`League ID: ${league.id}\n`)

  // Try to get admins with simpler query
  console.log('Checking league_admins table...')
  const { data: admins, error: adminsError } = await supabaseAdmin
    .from('league_admins')
    .select('*')
    .eq('league_id', league.id)

  if (adminsError) {
    console.error('❌ Error querying league_admins:', adminsError)
    return
  }

  console.log(`Found ${admins?.length || 0} admin records\n`)

  if (admins && admins.length > 0) {
    console.log('Admin records:')
    for (const admin of admins) {
      console.log(`  - User ID: ${admin.user_id}`)
      console.log(`    Created: ${admin.created_at}`)

      // Get user details
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', admin.user_id)
        .single()

      if (user) {
        console.log(`    User: ${user.first_name} ${user.last_name} (${user.email})`)
      }
      console.log()
    }
  }

  // Also check specific users
  console.log('\nChecking specific users:')
  const emails = ['technik87@tlen.pl', 'bartek.zoltowski88@gmail.com']

  for (const email of emails) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (!user) {
      console.log(`  ❌ ${email}: User not found`)
      continue
    }

    const { data: adminRecord } = await supabaseAdmin
      .from('league_admins')
      .select('id')
      .eq('league_id', league.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (adminRecord) {
      console.log(`  ✅ ${email}: IS admin of WNC`)
    } else {
      console.log(`  ❌ ${email}: NOT admin of WNC`)
    }
  }
}

verifyAdmins()
  .then(() => {
    console.log('\n✅ Verification complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Error:', err)
    process.exit(1)
  })
