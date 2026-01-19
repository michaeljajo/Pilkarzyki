/**
 * Add technik87@tlen.pl and bartek.zoltowski88@gmail.com as WNC league admins
 * Run this AFTER the migration 017 has been executed
 */

import { supabaseAdmin } from '../src/lib/supabase'
import { addLeagueAdmin } from '../src/lib/auth-helpers'

async function addWNCAdmins() {
  console.log('Adding WNC league admins...\n')

  // Step 1: Get WNC league
  const { data: league, error: leagueError } = await supabaseAdmin
    .from('leagues')
    .select('id, name, admin_id')
    .ilike('name', '%WNC%')
    .single()

  if (leagueError || !league) {
    console.error('❌ WNC league not found:', leagueError)
    return
  }

  console.log(`Found league: ${league.name}`)
  console.log(`League ID: ${league.id}\n`)

  // Step 2: Get users to add as admins
  const emailsToAdd = ['technik87@tlen.pl', 'bartek.zoltowski88@gmail.com']
  const userIds: string[] = []

  for (const email of emailsToAdd) {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error(`❌ User not found: ${email}`)
      continue
    }

    console.log(`Found user: ${user.first_name} ${user.last_name} (${user.email})`)
    userIds.push(user.id)
  }

  if (userIds.length === 0) {
    console.error('\n❌ No valid users found')
    return
  }

  console.log(`\nAdding ${userIds.length} users as WNC admins...`)

  // Step 3: Add users as admins
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i]
    const email = emailsToAdd[i]

    console.log(`\nAdding ${email}...`)

    const result = await addLeagueAdmin(league.id, userId)

    if (result.success) {
      console.log(`  ✅ Successfully added as admin`)
    } else {
      console.log(`  ⚠️  ${result.error}`)
    }
  }

  // Step 4: Verify final admin list
  console.log('\n\n=== Final WNC Admin List ===')
  const { data: finalAdmins } = await supabaseAdmin
    .from('league_admins')
    .select(`
      user_id,
      users!inner(email, first_name, last_name)
    `)
    .eq('league_id', league.id)

  if (finalAdmins && finalAdmins.length > 0) {
    finalAdmins.forEach((admin: any) => {
      console.log(`  ✓ ${admin.users.first_name} ${admin.users.last_name} (${admin.users.email})`)
    })
    console.log(`\nTotal admins: ${finalAdmins.length}/5`)
  } else {
    console.log('  No admins found')
  }
}

addWNCAdmins()
  .then(() => {
    console.log('\n✅ Complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Error:', err)
    process.exit(1)
  })
