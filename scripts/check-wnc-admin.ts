/**
 * Check WNC league admin status for specific users
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function checkWNCAdmin() {
  console.log('Checking WNC league admin status...\n')

  // Find WNC league
  const { data: leagues, error: leagueError } = await supabaseAdmin
    .from('leagues')
    .select('id, name, admin_id')
    .ilike('name', '%WNC%')

  if (leagueError) {
    console.error('Error fetching leagues:', leagueError)
    return
  }

  if (!leagues || leagues.length === 0) {
    console.log('No WNC league found')
    return
  }

  console.log('Found leagues:')
  leagues.forEach(league => {
    console.log(`  - ${league.name} (${league.id})`)
    console.log(`    Admin ID: ${league.admin_id}`)
  })
  console.log()

  // Check users
  const emails = ['technik87@tlen.pl', 'bartek.zoltowski88@gmail.com']

  for (const email of emails) {
    console.log(`\nChecking user: ${email}`)

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id, email, first_name, last_name, is_admin')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.log(`  ❌ User not found or error: ${userError?.message}`)
      continue
    }

    console.log(`  User ID: ${user.id}`)
    console.log(`  Clerk ID: ${user.clerk_id}`)
    console.log(`  Name: ${user.first_name} ${user.last_name}`)
    console.log(`  Global Admin: ${user.is_admin}`)

    // Check if user is admin of any WNC league
    const adminOfLeagues = leagues.filter(l => l.admin_id === user.id)
    console.log(`  Admin of ${adminOfLeagues.length} WNC league(s):`)
    adminOfLeagues.forEach(league => {
      console.log(`    ✓ ${league.name}`)
    })

    if (adminOfLeagues.length === 0) {
      console.log(`    ❌ Not admin of any WNC league`)
    }

    // Check if user is a manager in any WNC league
    for (const league of leagues) {
      const { data: squads } = await supabaseAdmin
        .from('squads')
        .select('id, team_name')
        .eq('league_id', league.id)
        .eq('manager_id', user.id)

      if (squads && squads.length > 0) {
        console.log(`  Manager in ${league.name}:`)
        squads.forEach(squad => {
          console.log(`    - Squad: ${squad.team_name || 'Unnamed'}`)
        })
      }
    }
  }

  console.log('\n\n--- Summary ---')
  console.log('WNC Leagues found:', leagues.length)
  leagues.forEach(league => {
    console.log(`\n${league.name}:`)
    console.log(`  ID: ${league.id}`)
    console.log(`  Admin ID: ${league.admin_id}`)

    // Get admin user details
    supabaseAdmin
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', league.admin_id)
      .single()
      .then(({ data: admin }) => {
        if (admin) {
          console.log(`  Admin: ${admin.first_name} ${admin.last_name} (${admin.email})`)
        }
      })
  })
}

checkWNCAdmin().then(() => {
  setTimeout(() => process.exit(0), 1000) // Wait for async console.logs
})
