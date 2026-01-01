import { supabaseAdmin } from '../src/lib/supabase';

const WNC_LEAGUE_ID = '8b6d933e-e011-4fd5-8bc0-8344e2841192';

async function checkCupData() {
  console.log('\n=== CHECKING CUP DATA ===\n');

  // Get cup for WNC
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name')
    .eq('league_id', WNC_LEAGUE_ID)
    .single();

  if (!cup) {
    console.log('❌ No cup found for WNC league');
    return;
  }

  console.log(`Cup: ${cup.name} (${cup.id})\n`);

  // Count cup groups
  const { count: groupsCount } = await supabaseAdmin
    .from('cup_groups')
    .select('*', { count: 'exact', head: true })
    .eq('cup_id', cup.id);

  // Count cup gameweeks
  const { count: cupGameweeksCount } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('*', { count: 'exact', head: true })
    .eq('cup_id', cup.id);

  // Count cup matches
  const { count: cupMatchesCount } = await supabaseAdmin
    .from('cup_matches')
    .select('*', { count: 'exact', head: true })
    .eq('cup_id', cup.id);

  // Count cup lineups
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id')
    .eq('cup_id', cup.id);

  const cupGameweekIds = cupGameweeks?.map(gw => gw.id) || [];

  const { count: cupLineupsCount } = await supabaseAdmin
    .from('cup_lineups')
    .select('*', { count: 'exact', head: true })
    .in('cup_gameweek_id', cupGameweekIds);

  console.log('Cup Data Summary:');
  console.log(`  - Groups: ${groupsCount}`);
  console.log(`  - Cup Gameweeks: ${cupGameweeksCount}`);
  console.log(`  - Cup Matches: ${cupMatchesCount}`);
  console.log(`  - Cup Lineups: ${cupLineupsCount}\n`);

  // Now check results - cup uses same results table as league
  const { data: leagueGameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('id, week')
    .eq('league_id', WNC_LEAGUE_ID);

  const leagueGameweekIds = leagueGameweeks?.map(gw => gw.id) || [];

  const { count: resultsCount } = await supabaseAdmin
    .from('results')
    .select('*', { count: 'exact', head: true })
    .in('gameweek_id', leagueGameweekIds);

  console.log(`Results (shared with league): ${resultsCount}`);

  // Check if any cup lineups have players with results
  if (cupLineupsCount && cupLineupsCount > 0) {
    console.log('\nChecking cup lineups with goals...');

    const { data: sampleLineups } = await supabaseAdmin
      .from('cup_lineups')
      .select('id, player_ids, cup_gameweek_id')
      .in('cup_gameweek_id', cupGameweekIds)
      .limit(5);

    if (sampleLineups && sampleLineups.length > 0) {
      for (const lineup of sampleLineups) {
        // Get the league gameweek id for this cup gameweek
        const { data: cupGw } = await supabaseAdmin
          .from('cup_gameweeks')
          .select('league_gameweek_id')
          .eq('id', lineup.cup_gameweek_id)
          .single();

        if (cupGw) {
          const { data: results } = await supabaseAdmin
            .from('results')
            .select('goals, player_id')
            .eq('gameweek_id', cupGw.league_gameweek_id)
            .in('player_id', lineup.player_ids);

          const totalGoals = results?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0;
          console.log(`  Lineup ${lineup.id}: ${lineup.player_ids.length} players, ${totalGoals} total goals`);
        }
      }
    }
  }

  console.log('\n=== CHECK COMPLETE ===\n');
}

checkCupData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
