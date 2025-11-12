import { supabaseAdmin } from '../src/lib/supabase'

async function createMissingCupMatches() {
  const leagueId = '791f04ae-290b-4aed-8cc7-6070beaefa3a'

  // Get cup for the league
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name')
    .eq('league_id', leagueId)
    .single()

  if (!cup) {
    console.log('No cup found for this league')
    return
  }

  console.log(`\n=== Fixing Cup Matches for: ${cup.name} ===\n`)

  // Get all cup gameweeks
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select(`
      id,
      cup_week,
      stage,
      leg,
      league_gameweek_id
    `)
    .eq('cup_id', cup.id)
    .order('cup_week', { ascending: true })

  for (const cgw of cupGameweeks || []) {
    console.log(`\nProcessing Cup Week ${cgw.cup_week} (${cgw.stage}, Leg ${cgw.leg})...`)

    // Check if matches already exist
    const { data: existingMatches, count: matchCount } = await supabaseAdmin
      .from('cup_matches')
      .select('id', { count: 'exact' })
      .eq('cup_gameweek_id', cgw.id)

    if (matchCount && matchCount > 0) {
      console.log(`  ✓ Already has ${matchCount} match(es)`)
      continue
    }

    // Get all cup lineups for this gameweek
    const { data: lineups } = await supabaseAdmin
      .from('cup_lineups')
      .select('id, manager_id, player_ids')
      .eq('cup_gameweek_id', cgw.id)

    if (!lineups || lineups.length === 0) {
      console.log(`  ⚠ No lineups found - skipping`)
      continue
    }

    if (lineups.length % 2 !== 0) {
      console.log(`  ⚠ Odd number of lineups (${lineups.length}) - cannot pair into matches`)
      continue
    }

    console.log(`  Found ${lineups.length} lineups, creating ${lineups.length / 2} matches...`)

    // Group stage - need to determine which managers play each other
    // For knockout stages, pair managers in order (this is a simplification)
    const managerIds = lineups.map(l => l.manager_id)

    // Get group assignments if this is group stage
    let groupMatches: Array<[string, string]> = []

    if (cgw.stage === 'group_stage') {
      // Get cup groups
      const { data: cupGroups } = await supabaseAdmin
        .from('cup_groups')
        .select('group_name, manager_id')
        .eq('cup_id', cup.id)
        .in('manager_id', managerIds)

      // Group managers by group_name
      const groupMap = new Map<string, string[]>()
      cupGroups?.forEach(cg => {
        if (!groupMap.has(cg.group_name)) {
          groupMap.set(cg.group_name, [])
        }
        groupMap.get(cg.group_name)!.push(cg.manager_id)
      })

      // For each group, create all possible match pairs
      for (const [groupName, managers] of groupMap.entries()) {
        // Filter managers who have lineups
        const managersWithLineups = managers.filter(m => managerIds.includes(m))

        if (managersWithLineups.length >= 2) {
          // Create round-robin matches
          for (let i = 0; i < managersWithLineups.length; i++) {
            for (let j = i + 1; j < managersWithLineups.length; j++) {
              groupMatches.push([managersWithLineups[i], managersWithLineups[j]])
            }
          }
        }
      }

      console.log(`  Found ${groupMatches.length} group stage match pairs`)
    } else {
      // Knockout stage - pair in order
      for (let i = 0; i < managerIds.length; i += 2) {
        if (i + 1 < managerIds.length) {
          groupMatches.push([managerIds[i], managerIds[i + 1]])
        }
      }
      console.log(`  Created ${groupMatches.length} knockout match pairs`)
    }

    // Create matches
    let created = 0
    for (const [homeManagerId, awayManagerId] of groupMatches) {
      // Calculate scores
      const homeLineup = lineups.find(l => l.manager_id === homeManagerId)
      const awayLineup = lineups.find(l => l.manager_id === awayManagerId)

      if (!homeLineup || !awayLineup) {
        console.log(`  ⚠ Missing lineup for match, skipping`)
        continue
      }

      // Get results for both lineups
      const { data: homeResults } = await supabaseAdmin
        .from('results')
        .select('goals')
        .eq('gameweek_id', cgw.league_gameweek_id)
        .in('player_id', homeLineup.player_ids || [])

      const { data: awayResults } = await supabaseAdmin
        .from('results')
        .select('goals')
        .eq('gameweek_id', cgw.league_gameweek_id)
        .in('player_id', awayLineup.player_ids || [])

      const homeScore = homeResults?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
      const awayScore = awayResults?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0

      // Get group name if group stage
      let groupName = null
      if (cgw.stage === 'group_stage') {
        const { data: homeGroup } = await supabaseAdmin
          .from('cup_groups')
          .select('group_name')
          .eq('cup_id', cup.id)
          .eq('manager_id', homeManagerId)
          .single()

        groupName = homeGroup?.group_name || null
      }

      // Create cup match
      const { error: matchError } = await supabaseAdmin
        .from('cup_matches')
        .insert({
          cup_id: cup.id,
          cup_gameweek_id: cgw.id,
          home_manager_id: homeManagerId,
          away_manager_id: awayManagerId,
          stage: cgw.stage,
          leg: cgw.leg,
          group_name: groupName,
          home_score: homeScore,
          away_score: awayScore,
          is_completed: true
        })

      if (matchError) {
        console.log(`  ✗ Failed to create match: ${matchError.message}`)
      } else {
        console.log(`  ✓ Created match: ${homeScore} - ${awayScore}`)
        created++
      }
    }

    console.log(`  Created ${created} match(es) for Cup Week ${cgw.cup_week}`)
  }

  console.log('\n=== Done! ===\n')
}

createMissingCupMatches()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
