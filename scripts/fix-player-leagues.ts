import { supabaseAdmin } from '../src/lib/supabase'

async function fixPlayerLeagues() {
  const leagueId = '791f04ae-290b-4aed-8cc7-6070beaefa3a'
  const correctLeagueName = 'Test'

  // Get all players that don't have the correct league name
  const { data: players, error: fetchError } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, league')
    .neq('league', correctLeagueName)

  if (fetchError) {
    console.error('Error fetching players:', fetchError)
    return
  }

  console.log(`Found ${players?.length || 0} players with incorrect league names`)

  if (!players || players.length === 0) {
    console.log('No players to update')
    return
  }

  // Update all players to have the correct league name
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('players')
    .update({ league: correctLeagueName })
    .neq('league', correctLeagueName)
    .select()

  if (updateError) {
    console.error('Error updating players:', updateError)
  } else {
    console.log(`Successfully updated ${updated?.length || 0} players to league "${correctLeagueName}"`)
    console.log('Sample updated players:', updated?.slice(0, 5))
  }
}

fixPlayerLeagues()
