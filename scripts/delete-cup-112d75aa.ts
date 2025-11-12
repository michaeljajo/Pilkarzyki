import { supabaseAdmin } from '../src/lib/supabase'

async function deleteCup() {
  const cupId = '112d75aa-8b9e-461a-8be6-6d92920b46e0'

  console.log(`\n=== DELETING CUP ${cupId} ===\n`)

  // Get cup gameweek IDs
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id')
    .eq('cup_id', cupId)

  const cupGameweekIds = cupGameweeks?.map(cgw => cgw.id) || []
  console.log(`Found ${cupGameweekIds.length} cup gameweeks`)

  // Delete in order: lineups → matches → gameweeks → groups → cup

  if (cupGameweekIds.length > 0) {
    const { error: lineupsError, count: lineupsCount } = await supabaseAdmin
      .from('cup_lineups')
      .delete({ count: 'exact' })
      .in('cup_gameweek_id', cupGameweekIds)

    console.log(`✓ Deleted ${lineupsCount || 0} cup lineups`)
  }

  if (cupGameweekIds.length > 0) {
    const { error: matchesError, count: matchesCount } = await supabaseAdmin
      .from('cup_matches')
      .delete({ count: 'exact' })
      .in('cup_gameweek_id', cupGameweekIds)

    console.log(`✓ Deleted ${matchesCount || 0} cup matches`)
  }

  const { error: gameweeksError, count: gameweeksCount } = await supabaseAdmin
    .from('cup_gameweeks')
    .delete({ count: 'exact' })
    .eq('cup_id', cupId)

  console.log(`✓ Deleted ${gameweeksCount || 0} cup gameweeks`)

  const { error: groupsError, count: groupsCount } = await supabaseAdmin
    .from('cup_groups')
    .delete({ count: 'exact' })
    .eq('cup_id', cupId)

  console.log(`✓ Deleted ${groupsCount || 0} cup group entries`)

  const { error: cupError } = await supabaseAdmin
    .from('cups')
    .delete()
    .eq('id', cupId)

  console.log(`✓ Deleted cup`)
  console.log(`\n=== DELETION COMPLETE ===\n`)
}

deleteCup()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
