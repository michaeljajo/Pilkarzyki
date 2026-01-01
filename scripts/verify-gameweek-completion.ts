import { supabaseAdmin } from '../src/lib/supabase'

async function verifyGameweekCompletion() {
  console.log('\n=== Gameweek Completion Verification ===\n')

  const now = new Date()
  console.log(`Current time: ${now.toISOString()}\n`)

  // Check for any expired incomplete gameweeks
  const { data: expiredGameweeks, error } = await supabaseAdmin
    .from('gameweeks')
    .select('id, league_id, week, end_date, is_completed')
    .eq('is_completed', false)
    .lt('end_date', now.toISOString())
    .order('league_id')
    .order('week')

  if (error) {
    console.error('Error checking gameweeks:', error)
    return
  }

  if (!expiredGameweeks || expiredGameweeks.length === 0) {
    console.log('✅ All expired gameweeks are properly completed!')
    console.log('\nNo action needed - the system is working correctly.\n')
  } else {
    console.log(`❌ Found ${expiredGameweeks.length} expired gameweeks that are still incomplete:\n`)
    expiredGameweeks.forEach((gw) => {
      const daysPast = Math.floor((now.getTime() - new Date(gw.end_date).getTime()) / (1000 * 60 * 60 * 24))
      console.log(`  League ${gw.league_id.substring(0, 8)}..., Week ${gw.week}`)
      console.log(`    End date: ${gw.end_date} (${daysPast} days ago)`)
    })
    console.log('\n⚠️  Run: npm exec -- tsx scripts/manually-complete-gameweeks.ts\n')
  }

  // Show current league status
  const { data: leagues } = await supabaseAdmin
    .from('leagues')
    .select('id, name, current_gameweek')
    .order('name')

  if (leagues && leagues.length > 0) {
    console.log('\n=== Current League Status ===\n')
    for (const league of leagues) {
      console.log(`${league.name}:`)
      console.log(`  Current gameweek: ${league.current_gameweek}`)

      // Find next upcoming gameweek
      const { data: nextGameweek } = await supabaseAdmin
        .from('gameweeks')
        .select('week, start_date, end_date, lock_date, is_completed')
        .eq('league_id', league.id)
        .eq('is_completed', false)
        .order('week', { ascending: true })
        .limit(1)
        .single()

      if (nextGameweek) {
        console.log(`  Next gameweek: ${nextGameweek.week}`)
        console.log(`    Lock date: ${new Date(nextGameweek.lock_date).toISOString()}`)
        console.log(`    End date: ${new Date(nextGameweek.end_date).toISOString()}`)
      } else {
        console.log(`  ✅ All gameweeks completed!`)
      }
      console.log('')
    }
  }
}

verifyGameweekCompletion()
