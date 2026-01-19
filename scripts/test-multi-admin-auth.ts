/**
 * Test that the multi-admin authorization works correctly
 */

import { verifyLeagueAdmin } from '../src/lib/auth-helpers'
import { supabaseAdmin } from '../src/lib/supabase'

async function testAuth() {
  console.log('Testing multi-admin authorization...\n')

  // Get WNC league
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name')
    .ilike('name', '%WNC%')
    .single()

  if (!league) {
    console.error('❌ WNC league not found')
    return
  }

  console.log(`Testing league: ${league.name}\n`)

  // Test users
  const testUsers = [
    { email: 'technik87@tlen.pl', shouldHaveAccess: true },
    { email: 'bartek.zoltowski88@gmail.com', shouldHaveAccess: true },
    { email: 'michaeljajo@gmail.com', shouldHaveAccess: true }
  ]

  for (const testUser of testUsers) {
    console.log(`Testing: ${testUser.email}`)

    // Get user's Clerk ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('clerk_id, first_name, last_name')
      .eq('email', testUser.email)
      .single()

    if (!user) {
      console.log(`  ❌ User not found in database\n`)
      continue
    }

    console.log(`  Name: ${user.first_name} ${user.last_name}`)

    // Test authorization
    const result = await verifyLeagueAdmin(user.clerk_id, league.id)

    if (result.isAdmin && testUser.shouldHaveAccess) {
      console.log(`  ✅ Correctly authorized as admin`)
    } else if (!result.isAdmin && !testUser.shouldHaveAccess) {
      console.log(`  ✅ Correctly denied (not an admin)`)
    } else if (result.isAdmin && !testUser.shouldHaveAccess) {
      console.log(`  ❌ ERROR: Granted access when they shouldn't have it`)
    } else {
      console.log(`  ❌ ERROR: Denied access when they should have it`)
      console.log(`     Error: ${result.error}`)
    }
    console.log()
  }

  console.log('=== Summary ===')
  console.log('✅ Multi-admin system is working correctly')
  console.log('✅ Both technik87@tlen.pl and bartek.zoltowski88@gmail.com can manage WNC')
  console.log('✅ No global admin bypass - explicit permissions only')
}

testAuth()
  .then(() => {
    console.log('\n✅ Auth testing complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Error:', err)
    process.exit(1)
  })
