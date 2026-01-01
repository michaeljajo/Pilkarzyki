import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkWNCGameweeks() {
  // Find WNC league
  const { data: leagues, error: leagueError } = await supabase
    .from('leagues')
    .select('id, name, current_gameweek')
    .ilike('name', '%WNC%')

  if (leagueError) {
    console.error('Error fetching leagues:', leagueError)
    return
  }

  if (!leagues || leagues.length === 0) {
    console.log('No WNC league found')
    return
  }

  console.log('WNC Leagues:', leagues)

  for (const league of leagues) {
    console.log(`\n=== League: ${league.name} (Current GW: ${league.current_gameweek}) ===`)

    const { data: gameweeks, error: gwError } = await supabase
      .from('gameweeks')
      .select('week, start_date, end_date, lock_date, is_completed')
      .eq('league_id', league.id)
      .order('week', { ascending: true })

    if (gwError) {
      console.error('Error fetching gameweeks:', gwError)
      continue
    }

    console.log('\nGameweeks:')
    gameweeks?.forEach(gw => {
      const now = new Date()
      const endDate = new Date(gw.end_date)
      const isPast = endDate < now

      console.log(`Week ${gw.week}: ${gw.is_completed ? '✅ COMPLETED' : '⏳ INCOMPLETE'} | End: ${gw.end_date} ${isPast ? '(PAST)' : '(FUTURE)'}`)
    })

    // Count completed vs total
    const total = gameweeks?.length || 0
    const completed = gameweeks?.filter(gw => gw.is_completed).length || 0
    console.log(`\nTotal: ${total}, Completed: ${completed}, Incomplete: ${total - completed}`)
  }
}

checkWNCGameweeks()
