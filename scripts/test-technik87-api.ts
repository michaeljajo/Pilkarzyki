import { supabaseAdmin } from '../src/lib/supabase'

async function testTechnik87API() {
  const clerkUserId = 'user_359mqGrf3LhTayRt5JTbZW2mvoF' // technik87
  const leagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192' // WNC

  console.log('Testing API logic for technik87...\n')

  // Simulate what the API does
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, is_admin')
    .eq('clerk_id', clerkUserId)
    .single()

  console.log('1. User Record:')
  console.log('   Email:', user?.email)
  console.log('   ID:', user?.id)
  console.log('   is_admin:', user?.is_admin)
  console.log('   Error:', userError)
  console.log()

  if (!user) {
    console.log('❌ User not found!')
    return
  }

  // Get league details
  const { data: league, error: leagueError } = await supabaseAdmin
    .from('leagues')
    .select('id, name, admin_id')
    .eq('id', leagueId)
    .single()

  console.log('2. League Record:')
  console.log('   Name:', league?.name)
  console.log('   Admin ID:', league?.admin_id)
  console.log('   Error:', leagueError)
  console.log()

  if (!league) {
    console.log('❌ League not found!')
    return
  }

  // Check admin status
  const isLeagueCreator = league.admin_id === user.id
  const isGlobalAdmin = user.is_admin === true
  const userIsAdmin = isLeagueCreator || isGlobalAdmin

  console.log('3. Admin Check:')
  console.log('   Is League Creator:', isLeagueCreator)
  console.log('   Is Global Admin:', isGlobalAdmin)
  console.log('   Final user_is_admin:', userIsAdmin)
  console.log()

  console.log('4. API Response Would Be:')
  console.log(JSON.stringify({
    league: {
      id: league.id,
      name: league.name,
      user_is_admin: userIsAdmin
    }
  }, null, 2))
}

testTechnik87API()
