import { supabaseAdmin } from '../src/lib/supabase';

async function deleteWNCData() {
  try {
    console.log('Finding WNC league...');

    // Find the WNC league
    const { data: leagues, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .ilike('name', '%WNC%');

    if (leagueError) {
      console.error('Error finding WNC league:', leagueError);
      return;
    }

    if (!leagues || leagues.length === 0) {
      console.error('No WNC league found');
      return;
    }

    if (leagues.length > 1) {
      console.log('Multiple leagues found:');
      leagues.forEach(l => console.log(`  - ${l.name} (${l.id})`));
      console.log('Please update the script to specify which league to delete');
      return;
    }

    const league = leagues[0];
    console.log(`Found league: ${league.name} (${league.id})`);

    // Get all gameweeks for this league
    console.log('\nFetching gameweeks for this league...');
    const { data: gameweeks, error: gameweekError } = await supabaseAdmin
      .from('gameweeks')
      .select('id')
      .eq('league_id', league.id);

    if (gameweekError) {
      console.error('Error fetching gameweeks:', gameweekError);
      return;
    }

    if (!gameweeks || gameweeks.length === 0) {
      console.log('No gameweeks found for this league');
      return;
    }

    const gameweekIds = gameweeks.map(gw => gw.id);
    console.log(`Found ${gameweekIds.length} gameweeks`);

    // Get counts before deletion
    const { count: resultsCount } = await supabaseAdmin
      .from('results')
      .select('*', { count: 'exact', head: true })
      .in('gameweek_id', gameweekIds);

    const { count: lineupsCount } = await supabaseAdmin
      .from('lineups')
      .select('*', { count: 'exact', head: true })
      .in('gameweek_id', gameweekIds);

    console.log(`\nData to be deleted:`);
    console.log(`  - Results: ${resultsCount}`);
    console.log(`  - Lineups: ${lineupsCount}`);

    // Delete results
    console.log('\nDeleting results...');
    const { error: resultsError } = await supabaseAdmin
      .from('results')
      .delete()
      .in('gameweek_id', gameweekIds);

    if (resultsError) {
      console.error('Error deleting results:', resultsError);
      return;
    }
    console.log(`✓ Deleted ${resultsCount} results`);

    // Delete lineups
    console.log('\nDeleting lineups...');
    const { error: lineupsError } = await supabaseAdmin
      .from('lineups')
      .delete()
      .in('gameweek_id', gameweekIds);

    if (lineupsError) {
      console.error('Error deleting lineups:', lineupsError);
      return;
    }
    console.log(`✓ Deleted ${lineupsCount} lineups`);

    // Verify deletion
    const { count: remainingResults } = await supabaseAdmin
      .from('results')
      .select('*', { count: 'exact', head: true })
      .in('gameweek_id', gameweekIds);

    const { count: remainingLineups } = await supabaseAdmin
      .from('lineups')
      .select('*', { count: 'exact', head: true })
      .in('gameweek_id', gameweekIds);

    console.log(`\nVerification:`);
    console.log(`  - Remaining results: ${remainingResults}`);
    console.log(`  - Remaining lineups: ${remainingLineups}`);

    console.log('\n✅ Deletion completed successfully!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

deleteWNCData();
