/**
 * Diagnose top scorers issue
 * Check why players might be showing as unassigned
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function diagnose() {
  console.log('🔍 Diagnosing top scorers issue...\n')

  try {
    // Get the WNC league (or whichever league you're looking at)
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('name', 'WNC')
      .single()

    if (!league) {
      console.error('League not found')
      return
    }

    console.log(`Analyzing league: ${league.name} (${league.id})\n`)

    // 1. Check for players in this league without transfer records
    console.log('1. Checking for players without transfer records...')

    const { data: playersWithoutTransfers } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, manager_id, league')
      .eq('league', league.name)

    const playerIds = playersWithoutTransfers?.map(p => p.id) || []

    const { data: existingTransfers } = await supabaseAdmin
      .from('player_transfers')
      .select('player_id, league_id')
      .in('player_id', playerIds)
      .eq('league_id', league.id)

    const playersWithTransfers = new Set(existingTransfers?.map(t => t.player_id) || [])

    const missingTransfers = playersWithoutTransfers?.filter(p => !playersWithTransfers.has(p.id)) || []

    if (missingTransfers.length > 0) {
      console.log(`❌ Found ${missingTransfers.length} players without transfer records!`)
      console.log('Sample players:')
      missingTransfers.slice(0, 10).forEach(p => {
        console.log(`  - ${p.name} ${p.surname} (manager_id: ${p.manager_id || 'NULL'})`)
      })
    } else {
      console.log(`✅ All ${playersWithoutTransfers?.length} players have transfer records`)
    }

    // 2. Check transfer records for this league
    console.log('\n2. Checking transfer records for this league...')

    const { data: leagueTransfers } = await supabaseAdmin
      .from('player_transfers')
      .select(`
        id,
        player_id,
        manager_id,
        league_id,
        effective_from,
        effective_until,
        players:player_id (
          name,
          surname,
          league,
          manager_id
        )
      `)
      .eq('league_id', league.id)
      .limit(10)

    console.log(`Found ${leagueTransfers?.length} transfer records (showing first 10):`)
    leagueTransfers?.forEach(t => {
      const player = Array.isArray(t.players) ? t.players[0] : t.players
      console.log(`  - ${player?.name} ${player?.surname}: transfer manager=${t.manager_id}, player manager=${player?.manager_id}`)
    })

    // 3. Check a specific gameweek's results
    console.log('\n3. Checking recent gameweek results...')

    const { data: gameweeks } = await supabaseAdmin
      .from('gameweeks')
      .select('id, week, start_date')
      .eq('league_id', league.id)
      .order('week', { ascending: false })
      .limit(1)

    if (gameweeks && gameweeks.length > 0) {
      const latestGameweek = gameweeks[0]
      console.log(`Latest gameweek: Week ${latestGameweek.week} (${latestGameweek.id})`)

      const { data: results } = await supabaseAdmin
        .from('results')
        .select(`
          id,
          player_id,
          goals,
          gameweek_id,
          players:player_id (
            name,
            surname,
            manager_id,
            league
          )
        `)
        .eq('gameweek_id', latestGameweek.id)
        .gt('goals', 0)
        .limit(10)

      console.log(`\nPlayers who scored in this gameweek:`)

      for (const result of results || []) {
        const player = Array.isArray(result.players) ? result.players[0] : result.players

        // Check if this player has a transfer record for this gameweek
        const { data: transfer } = await supabaseAdmin
          .from('player_transfers')
          .select('manager_id, league_id')
          .eq('player_id', result.player_id)
          .eq('league_id', league.id)
          .lte('effective_from', latestGameweek.start_date)
          .or(`effective_until.is.null,effective_until.gte.${latestGameweek.start_date}`)
          .order('effective_from', { ascending: false })
          .limit(1)
          .single()

        const hasTransfer = transfer ? '✓' : '✗'
        const transferManager = transfer?.manager_id || 'NULL'

        console.log(`  ${hasTransfer} ${player?.name} ${player?.surname} - ${result.goals} goals`)
        console.log(`     Player manager_id: ${player?.manager_id}`)
        console.log(`     Transfer manager_id: ${transferManager}`)
        console.log(`     Transfer league: ${transfer?.league_id}`)
      }
    }

    // 4. Check for transfers pointing to wrong league
    console.log('\n4. Checking for mismatched league transfers...')

    const { data: allPlayers } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, league')
      .eq('league', league.name)

    let mismatchCount = 0
    for (const player of allPlayers || []) {
      const { data: transfers } = await supabaseAdmin
        .from('player_transfers')
        .select('league_id, leagues:league_id(name)')
        .eq('player_id', player.id)

      const wrongLeague = transfers?.find(t => {
        const leagueData = Array.isArray(t.leagues) ? t.leagues[0] : t.leagues
        return leagueData?.name !== league.name
      })

      if (wrongLeague) {
        mismatchCount++
        if (mismatchCount <= 5) {
          const leagueData = Array.isArray(wrongLeague.leagues) ? wrongLeague.leagues[0] : wrongLeague.leagues
          console.log(`  ⚠️ ${player.name} ${player.surname} (league: ${player.league}) has transfer in: ${leagueData?.name}`)
        }
      }
    }

    if (mismatchCount > 0) {
      console.log(`\n❌ Found ${mismatchCount} players with transfers in wrong league!`)
    } else {
      console.log(`\n✅ No mismatched league transfers found`)
    }

  } catch (error: any) {
    console.error('\n❌ Diagnosis failed:', error.message || error)
    if (error.details) console.error('Details:', error.details)
    process.exit(1)
  }
}

diagnose().then(() => {
  console.log('\n✅ Diagnosis complete!')
  process.exit(0)
})
