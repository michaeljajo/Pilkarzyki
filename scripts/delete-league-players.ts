import { supabaseAdmin } from '../src/lib/supabase'

async function deleteLeaguePlayers() {
  try {
    const leagueName = 'Test' // Change this if your league has a different name

    console.log(`Deleting all players from league: ${leagueName}`)

    // First, get all player IDs in this league
    const { data: players, error: fetchError } = await supabaseAdmin
      .from('players')
      .select('id, name, surname')
      .eq('league', leagueName)

    if (fetchError) {
      console.error('Error fetching players:', fetchError)
      return
    }

    if (!players || players.length === 0) {
      console.log('No players found in this league.')
      return
    }

    console.log(`Found ${players.length} players to delete:`)
    players.forEach(p => console.log(`  - ${p.name} ${p.surname}`))

    const playerIds = players.map(p => p.id)

    // Delete related data first (to avoid foreign key constraints)

    // Delete from squad_players
    const { error: squadPlayersError } = await supabaseAdmin
      .from('squad_players')
      .delete()
      .in('player_id', playerIds)

    if (squadPlayersError) {
      console.error('Error deleting squad_players:', squadPlayersError)
    } else {
      console.log('✓ Deleted squad_players entries')
    }

    // Delete from results (gameweek results)
    const { error: resultsError } = await supabaseAdmin
      .from('results')
      .delete()
      .in('player_id', playerIds)

    if (resultsError) {
      console.error('Error deleting results:', resultsError)
    } else {
      console.log('✓ Deleted results entries')
    }

    // Now delete the players themselves
    const { error: deleteError } = await supabaseAdmin
      .from('players')
      .delete()
      .eq('league', leagueName)

    if (deleteError) {
      console.error('Error deleting players:', deleteError)
      return
    }

    console.log(`\n✅ Successfully deleted all ${players.length} players from "${leagueName}" league`)
    console.log('\nYou can now re-import your Excel file with the League column.')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

deleteLeaguePlayers()
