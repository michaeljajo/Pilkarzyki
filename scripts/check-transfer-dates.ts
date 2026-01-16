/**
 * Check effective_from dates on transfers for unassigned players
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function checkDates() {
  console.log('🔍 Checking transfer effective dates...\n')

  const unassignedPlayerNames = [
    'Vinicius Jr',
    'Mohamed Salah',
    'Serhou Guirassy',
    'Filip Stojilkovic',
    'Jonathan Burkardt'
  ]

  // Get WNC league
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name')
    .eq('name', 'WNC')
    .single()

  if (!league) return

  // Get earliest gameweek
  const { data: earliestGW } = await supabaseAdmin
    .from('gameweeks')
    .select('id, week, start_date, end_date')
    .eq('league_id', league.id)
    .order('week', { ascending: true })
    .limit(1)
    .single()

  console.log(`Earliest gameweek: Week ${earliestGW?.week}`)
  console.log(`Start date: ${earliestGW?.start_date}`)
  console.log(`End date: ${earliestGW?.end_date}\n`)

  // Check each player
  for (const playerName of unassignedPlayerNames) {
    const [firstName, ...rest] = playerName.split(' ')
    const lastName = rest.join(' ')

    const { data: player } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, manager_id, created_at, league')
      .eq('name', firstName)
      .eq('surname', lastName)
      .eq('league', 'WNC')
      .single()

    if (!player) continue

    console.log(`\n${player.name} ${player.surname}:`)
    console.log(`  Player created: ${player.created_at}`)
    console.log(`  Manager ID: ${player.manager_id}`)

    const { data: transfers } = await supabaseAdmin
      .from('player_transfers')
      .select('*')
      .eq('player_id', player.id)
      .eq('league_id', league.id)
      .order('effective_from', { ascending: true })

    console.log(`  Transfers: ${transfers?.length}`)
    transfers?.forEach(t => {
      console.log(`    - From: ${t.effective_from}`)
      console.log(`      Until: ${t.effective_until || 'NULL (active)'}`)
      console.log(`      Manager: ${t.manager_id}`)
      console.log(`      Type: ${t.transfer_type}`)

      // Check if effective_from is after earliest gameweek start
      const effectiveFrom = new Date(t.effective_from)
      const gwStart = new Date(earliestGW!.start_date)

      if (effectiveFrom > gwStart) {
        console.log(`      ⚠️  ISSUE: effective_from (${t.effective_from}) is AFTER gameweek start (${earliestGW?.start_date})`)
      }
    })

    // Check what happens when we query for this player at the earliest gameweek
    if (earliestGW) {
      const { data: matchingTransfer } = await supabaseAdmin
        .from('player_transfers')
        .select('*')
        .eq('player_id', player.id)
        .eq('league_id', league.id)
        .lte('effective_from', earliestGW.start_date)
        .or(`effective_until.is.null,effective_until.gte.${earliestGW.start_date}`)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single()

      if (!matchingTransfer) {
        console.log(`  ❌ NO transfer found for earliest gameweek (${earliestGW.start_date})`)
      } else {
        console.log(`  ✅ Transfer found for earliest gameweek: ${matchingTransfer.manager_id}`)
      }
    }
  }
}

checkDates().then(() => {
  console.log('\n✅ Check complete!')
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})
