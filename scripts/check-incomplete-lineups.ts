import { supabaseAdmin } from '../src/lib/supabase'

async function checkIncompleteLineups() {
  const cupId = '5fa7dd11-0beb-4606-b499-cb37ac6cf05d'

  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id')
    .eq('cup_id', cupId)

  const cgwIds = cupGameweeks?.map(cgw => cgw.id) || []

  const { data: lineups } = await supabaseAdmin
    .from('cup_lineups')
    .select('id, cup_gameweek_id, manager_id, player_ids')
    .in('cup_gameweek_id', cgwIds)

  const incomplete = lineups?.filter(l => l.player_ids.length < 3) || []

  console.log(`\n=== Lineup Analysis ===`)
  console.log(`Total lineups: ${lineups?.length || 0}`)
  console.log(`Complete (3 players): ${lineups?.filter(l => l.player_ids.length === 3).length || 0}`)
  console.log(`Incomplete (< 3 players): ${incomplete.length}\n`)

  if (incomplete.length > 0) {
    console.log(`Affected lineups:`)
    for (const lineup of incomplete) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', lineup.manager_id)
        .single()

      const { data: cgw } = await supabaseAdmin
        .from('cup_gameweeks')
        .select('cup_week')
        .eq('id', lineup.cup_gameweek_id)
        .single()

      console.log(`  - Cup Week ${cgw?.cup_week}: ${user?.email} (${lineup.player_ids.length} players)`)
    }

    console.log(`\n⚠️ These lineups are missing players due to typos in migration file.`)
    console.log(`To fix: Correct typos in Excel → Delete cup data → Re-import`)
  } else {
    console.log(`✓ All lineups have 3 players! The typos didn't affect any lineups.`)
  }
}

checkIncompleteLineups()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
