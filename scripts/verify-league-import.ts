import { supabaseAdmin } from '../src/lib/supabase';

const WNC_LEAGUE_ID = '8b6d933e-e011-4fd5-8bc0-8344e2841192';

async function verifyImport() {
  console.log('\n=== VERIFYING LEAGUE IMPORT ===\n');

  // Get all gameweeks for WNC league
  const { data: gameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('id')
    .eq('league_id', WNC_LEAGUE_ID);

  const gameweekIds = gameweeks?.map(gw => gw.id) || [];

  // Count lineups
  const { count: lineupsCount } = await supabaseAdmin
    .from('lineups')
    .select('*', { count: 'exact', head: true })
    .in('gameweek_id', gameweekIds);

  // Count results
  const { count: resultsCount } = await supabaseAdmin
    .from('results')
    .select('*', { count: 'exact', head: true })
    .in('gameweek_id', gameweekIds);

  console.log(`Gameweeks: ${gameweekIds.length}`);
  console.log(`Lineups: ${lineupsCount}`);
  console.log(`Results: ${resultsCount}`);

  // Check for "Riccardo Orsolini" variations
  console.log('\nSearching for Riccardo Orsolini variations...');
  const { data: players } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, league')
    .or('name.ilike.%riccardo%,surname.ilike.%orsolini%')
    .eq('league', 'WNC');

  if (players && players.length > 0) {
    console.log('Found players:');
    players.forEach(p => {
      console.log(`  - ${p.name} ${p.surname} (ID: ${p.id})`);
    });
  } else {
    console.log('No players found matching "Riccardo Orsolini"');
  }

  console.log('\n=== VERIFICATION COMPLETE ===\n');
}

verifyImport()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
