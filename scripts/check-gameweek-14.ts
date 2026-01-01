import { supabaseAdmin } from '../src/lib/supabase'

async function checkGameweek14() {
  const { data: gameweeks, error } = await supabaseAdmin
    .from('gameweeks')
    .select('id, league_id, week, start_date, end_date, lock_date, is_completed')
    .eq('week', 14)
    .order('league_id')

  if (error) {
    console.error('Error fetching gameweek 14:', error)
    return
  }

  console.log('\n=== Gameweek 14 Status ===')
  console.log('Current date:', new Date().toISOString())
  console.log('\n')

  if (!gameweeks || gameweeks.length === 0) {
    console.log('No gameweek 14 found')
    return
  }

  gameweeks.forEach((gw) => {
    console.log(`League ID: ${gw.league_id}`)
    console.log(`  Week: ${gw.week}`)
    console.log(`  Start Date: ${gw.start_date}`)
    console.log(`  Lock Date: ${gw.lock_date}`)
    console.log(`  End Date: ${gw.end_date}`)
    console.log(`  Is Completed: ${gw.is_completed}`)
    console.log(`  Days past end date: ${Math.floor((new Date().getTime() - new Date(gw.end_date).getTime()) / (1000 * 60 * 60 * 24))}`)
    console.log('')
  })

  // Also check all incomplete gameweeks that are past their end date
  const now = new Date().toISOString()
  const { data: expiredGameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('id, league_id, week, end_date, is_completed')
    .eq('is_completed', false)
    .lt('end_date', now)
    .order('league_id')
    .order('week')

  console.log('\n=== All Expired Incomplete Gameweeks ===')
  if (expiredGameweeks && expiredGameweeks.length > 0) {
    expiredGameweeks.forEach((gw) => {
      console.log(`League: ${gw.league_id}, Week: ${gw.week}, End: ${gw.end_date}`)
    })
  } else {
    console.log('No expired incomplete gameweeks found')
  }
}

checkGameweek14()
