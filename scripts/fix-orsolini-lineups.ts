import { supabaseAdmin } from '../src/lib/supabase';
import * as XLSX from 'xlsx';
import {
  parseManagersMapping,
  parseLeagueFixtures,
  type ManagersMappingRow,
  type LeagueFixtureRow
} from '../src/utils/migration-parser';

const MIGRATION_FILE_PATH = '/Users/michael/Desktop/VS Code/Pilkarzyki/migrations/migration-template (1).xlsx';
const WNC_LEAGUE_ID = '8b6d933e-e011-4fd5-8bc0-8344e2841192';

async function fixOrsoliniLineups() {
  console.log('\n=== FIXING ORSOLINI LINEUPS ===\n');

  // Get Riccardo Orsolini player info
  const { data: player } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, manager_id')
    .eq('name', 'Riccardo')
    .eq('surname', 'Orsolini')
    .eq('league', 'WNC')
    .single();

  if (!player) {
    console.error('Riccardo Orsolini not found');
    process.exit(1);
  }

  console.log(`Found player: ${player.name} ${player.surname}`);
  console.log(`Player ID: ${player.id}`);
  console.log(`Manager ID: ${player.manager_id}\n`);

  // Parse Excel file
  const workbook = XLSX.readFile(MIGRATION_FILE_PATH);

  const managersMappingData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Managers_Mapping']
  ) as ManagersMappingRow[];

  const mm = parseManagersMapping(managersMappingData);

  const leagueFixturesData = XLSX.utils.sheet_to_json(
    workbook.Sheets['League_Fixtures_And_Results']
  ) as LeagueFixtureRow[];

  const lf = parseLeagueFixtures(leagueFixturesData, mm.data);

  // Get existing gameweeks
  const { data: existingGameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('id, week')
    .eq('league_id', WNC_LEAGUE_ID)
    .order('week');

  const gameweekMap = new Map(existingGameweeks?.map(gw => [gw.week, gw.id]));

  // Get manager map
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email');

  const managerMap = new Map(users?.map(u => [u.email.toLowerCase(), u.id]));

  // Find fixtures where Riccardo Orsolini appears
  let lineupsUpdated = 0;

  for (const match of lf.data) {
    const gameweekId = gameweekMap.get(match.gameweek);
    if (!gameweekId) continue;

    // Check home lineup
    const homePlayers = [
      match.homeLineup.player1,
      match.homeLineup.player2,
      match.homeLineup.player3
    ].filter(Boolean);

    const homeHasOrsolini = homePlayers.some(
      name => name?.toLowerCase().trim() === 'riccardo orsolini'
    );

    if (homeHasOrsolini) {
      const homeManagerId = managerMap.get(match.homeManager.toLowerCase());

      if (homeManagerId === player.manager_id) {
        // Get the lineup
        const { data: lineup } = await supabaseAdmin
          .from('lineups')
          .select('id, player_ids')
          .eq('manager_id', homeManagerId)
          .eq('gameweek_id', gameweekId)
          .single();

        if (lineup && !lineup.player_ids.includes(player.id)) {
          // Add Riccardo to the lineup
          const updatedPlayerIds = [...lineup.player_ids, player.id];

          const { error } = await supabaseAdmin
            .from('lineups')
            .update({ player_ids: updatedPlayerIds })
            .eq('id', lineup.id);

          if (!error) {
            console.log(`✓ Updated home lineup - GW${match.gameweek} - ${match.homeManager}`);
            lineupsUpdated++;
          } else {
            console.log(`✗ Failed to update home lineup - GW${match.gameweek}:`, error.message);
          }
        }
      }
    }

    // Check away lineup
    const awayPlayers = [
      match.awayLineup.player1,
      match.awayLineup.player2,
      match.awayLineup.player3
    ].filter(Boolean);

    const awayHasOrsolini = awayPlayers.some(
      name => name?.toLowerCase().trim() === 'riccardo orsolini'
    );

    if (awayHasOrsolini) {
      const awayManagerId = managerMap.get(match.awayManager.toLowerCase());

      if (awayManagerId === player.manager_id) {
        // Get the lineup
        const { data: lineup } = await supabaseAdmin
          .from('lineups')
          .select('id, player_ids')
          .eq('manager_id', awayManagerId)
          .eq('gameweek_id', gameweekId)
          .single();

        if (lineup && !lineup.player_ids.includes(player.id)) {
          // Add Riccardo to the lineup
          const updatedPlayerIds = [...lineup.player_ids, player.id];

          const { error } = await supabaseAdmin
            .from('lineups')
            .update({ player_ids: updatedPlayerIds })
            .eq('id', lineup.id);

          if (!error) {
            console.log(`✓ Updated away lineup - GW${match.gameweek} - ${match.awayManager}`);
            lineupsUpdated++;
          } else {
            console.log(`✗ Failed to update away lineup - GW${match.gameweek}:`, error.message);
          }
        }
      }
    }
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`✓ Lineups updated: ${lineupsUpdated}`);
  console.log(`================\n`);
}

fixOrsoliniLineups()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
