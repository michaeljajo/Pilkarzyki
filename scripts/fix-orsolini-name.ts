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

async function fixOrsoliniName() {
  console.log('\n=== FIXING ORSOLINI NAME ===\n');

  // Step 1: Update player name in database
  console.log('Step 1: Updating player name in database...');

  const { data: player, error: findError } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, manager_id, league')
    .eq('name', 'Ricardo')
    .eq('surname', 'Orsolini')
    .eq('league', 'WNC')
    .single();

  if (findError || !player) {
    console.error('Player "Ricardo Orsolini" not found:', findError);
    process.exit(1);
  }

  console.log(`Found player: ${player.name} ${player.surname} (ID: ${player.id})`);

  const { error: updateError } = await supabaseAdmin
    .from('players')
    .update({ name: 'Riccardo' })
    .eq('id', player.id);

  if (updateError) {
    console.error('Failed to update player name:', updateError);
    process.exit(1);
  }

  console.log('✓ Updated player name to "Riccardo Orsolini"\n');

  // Step 2: Parse Excel and find missing results
  console.log('Step 2: Parsing Excel file to find missing results...');

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

  // Find fixtures with "Riccardo Orsolini"
  let resultsCreated = 0;

  for (const match of lf.data) {
    const gameweekId = gameweekMap.get(match.gameweek);
    if (!gameweekId) continue;

    // Check home lineup
    const homePlayers = [
      { name: match.homeLineup.player1, goals: match.homeGoals.player1 },
      { name: match.homeLineup.player2, goals: match.homeGoals.player2 },
      { name: match.homeLineup.player3, goals: match.homeGoals.player3 }
    ];

    for (const p of homePlayers) {
      if (p.name?.toLowerCase().trim() === 'riccardo orsolini') {
        if (p.goals !== undefined && p.goals !== null) {
          // Check if result already exists
          const { data: existing } = await supabaseAdmin
            .from('results')
            .select('id')
            .eq('gameweek_id', gameweekId)
            .eq('player_id', player.id)
            .single();

          if (!existing) {
            const { error } = await supabaseAdmin
              .from('results')
              .insert({
                gameweek_id: gameweekId,
                player_id: player.id,
                goals: p.goals,
                has_played: true
              });

            if (!error) {
              console.log(`  ✓ Added result: GW${match.gameweek} - ${p.goals} goals`);
              resultsCreated++;
            }
          }
        }
      }
    }

    // Check away lineup
    const awayPlayers = [
      { name: match.awayLineup.player1, goals: match.awayGoals.player1 },
      { name: match.awayLineup.player2, goals: match.awayGoals.player2 },
      { name: match.awayLineup.player3, goals: match.awayGoals.player3 }
    ];

    for (const p of awayPlayers) {
      if (p.name?.toLowerCase().trim() === 'riccardo orsolini') {
        if (p.goals !== undefined && p.goals !== null) {
          // Check if result already exists
          const { data: existing } = await supabaseAdmin
            .from('results')
            .select('id')
            .eq('gameweek_id', gameweekId)
            .eq('player_id', player.id)
            .single();

          if (!existing) {
            const { error } = await supabaseAdmin
              .from('results')
              .insert({
                gameweek_id: gameweekId,
                player_id: player.id,
                goals: p.goals,
                has_played: true
              });

            if (!error) {
              console.log(`  ✓ Added result: GW${match.gameweek} - ${p.goals} goals`);
              resultsCreated++;
            }
          }
        }
      }
    }
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`✓ Player name updated: Ricardo → Riccardo`);
  console.log(`✓ Results created: ${resultsCreated}`);
  console.log(`================\n`);
}

fixOrsoliniName()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
