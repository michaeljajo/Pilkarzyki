import { supabaseAdmin } from '../src/lib/supabase';

const WNC_LEAGUE_ID = '8b6d933e-e011-4fd5-8bc0-8344e2841192';

async function deleteCupData() {
  console.log('\n=== DELETING WNC CUP DATA ===\n');

  // Get cup
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name')
    .eq('league_id', WNC_LEAGUE_ID)
    .single();

  if (!cup) {
    console.log('No cup found');
    return;
  }

  console.log(`Cup: ${cup.name} (${cup.id})\n`);

  // Get cup gameweeks
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id')
    .eq('cup_id', cup.id);

  const cupGameweekIds = cupGameweeks?.map(gw => gw.id) || [];

  // Count before deletion
  const { count: lineupsCount } = await supabaseAdmin
    .from('cup_lineups')
    .select('*', { count: 'exact', head: true })
    .in('cup_gameweek_id', cupGameweekIds);

  const { count: matchesCount } = await supabaseAdmin
    .from('cup_matches')
    .select('*', { count: 'exact', head: true })
    .eq('cup_id', cup.id);

  const { count: gameweeksCount } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('*', { count: 'exact', head: true })
    .eq('cup_id', cup.id);

  const { count: groupsCount } = await supabaseAdmin
    .from('cup_groups')
    .select('*', { count: 'exact', head: true })
    .eq('cup_id', cup.id);

  const { count: standingsCount } = await supabaseAdmin
    .from('cup_group_standings')
    .select('*', { count: 'exact', head: true })
    .eq('cup_id', cup.id);

  console.log('Data to delete:');
  console.log(`  - Cup lineups: ${lineupsCount}`);
  console.log(`  - Cup matches: ${matchesCount}`);
  console.log(`  - Cup gameweeks: ${gameweeksCount}`);
  console.log(`  - Cup groups: ${groupsCount}`);
  console.log(`  - Cup standings: ${standingsCount}\n`);

  // Delete in order (respecting foreign keys)
  console.log('Deleting cup lineups...');
  await supabaseAdmin
    .from('cup_lineups')
    .delete()
    .in('cup_gameweek_id', cupGameweekIds);

  console.log('Deleting cup matches...');
  await supabaseAdmin
    .from('cup_matches')
    .delete()
    .eq('cup_id', cup.id);

  console.log('Deleting cup gameweeks...');
  await supabaseAdmin
    .from('cup_gameweeks')
    .delete()
    .eq('cup_id', cup.id);

  console.log('Deleting cup groups...');
  await supabaseAdmin
    .from('cup_groups')
    .delete()
    .eq('cup_id', cup.id);

  console.log('Deleting cup standings...');
  await supabaseAdmin
    .from('cup_group_standings')
    .delete()
    .eq('cup_id', cup.id);

  console.log('Deleting cup...');
  await supabaseAdmin
    .from('cups')
    .delete()
    .eq('id', cup.id);

  console.log('\n✓ All cup data deleted\n');
}

deleteCupData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
