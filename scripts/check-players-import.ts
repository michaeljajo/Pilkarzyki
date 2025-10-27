import { supabaseAdmin } from '../src/lib/supabase'

async function checkImport() {
  // Check the league name
  const { data: league, error: leagueError } = await supabaseAdmin
    .from('leagues')
    .select('id, name, season')
    .eq('id', '791f04ae-290b-4aed-8cc7-6070beaefa3a')
    .single()

  console.log('League:', league, leagueError)

  // Check imported players
  const { data: players, error: playersError } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, league, club, position')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('\nRecent players:', playersError || players)

  // Count players by league name
  const { data: leagueCounts, error: countError } = await supabaseAdmin
    .from('players')
    .select('league')

  if (!countError && leagueCounts) {
    const counts = leagueCounts.reduce((acc, p) => {
      acc[p.league] = (acc[p.league] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('\nPlayers by league:', counts)
  }
}

checkImport()
