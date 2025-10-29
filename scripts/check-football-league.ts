import { supabaseAdmin } from '../src/lib/supabase'

async function checkFootballLeague() {
  try {
    // Try to fetch players with football_league
    const { data: players, error } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, club, football_league')
      .limit(5)

    if (error) {
      console.error('Error fetching players:', error)
      console.log('\nThe football_league column likely does not exist yet.')
      console.log('Please run this SQL in Supabase:')
      console.log('ALTER TABLE players ADD COLUMN IF NOT EXISTS football_league TEXT;')
      return
    }

    console.log('Successfully queried football_league column!')
    console.log('\nFirst 5 players:')
    players?.forEach(player => {
      console.log(`${player.name} ${player.surname} - Club: ${player.club}, League: ${player.football_league || 'NULL'}`)
    })

    const hasData = players?.some(p => p.football_league)
    if (!hasData) {
      console.log('\n⚠️  Column exists but all values are NULL')
      console.log('The original import code did not save the League column from your Excel file.')
      console.log('You need to re-import your players for the League data to be saved.')
    } else {
      console.log('\n✓ Some players have football_league data')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkFootballLeague()
