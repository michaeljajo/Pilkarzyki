import { supabaseAdmin } from '../src/lib/supabase'
import * as XLSX from 'xlsx'
import {
  parseManagersMapping,
  parseCupFixtures,
  type ManagersMappingRow,
  type CupFixtureRow,
} from '../src/utils/migration-parser'

const MIGRATION_FILE_PATH = '/Users/michael/Desktop/VS Code/Pilkarzyki/migrations/migration-template (1).xlsx'
const WNC_LEAGUE_ID = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

async function debugCupImport() {
  console.log('\n=== DEBUG CUP IMPORT ===\n')

  // Parse Excel file
  const workbook = XLSX.readFile(MIGRATION_FILE_PATH)

  // Parse Managers_Mapping
  const managersMappingData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Managers_Mapping']
  ) as ManagersMappingRow[]

  const mm = parseManagersMapping(managersMappingData)

  // Parse Cup Fixtures
  const cupFixturesData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Cup_Fixtures_And_Results']
  ) as CupFixtureRow[]

  const cf = parseCupFixtures(cupFixturesData, mm.data)

  console.log(`Parsed ${cf.data.length} cup fixtures`)
  console.log(`Parsing errors: ${cf.errors.length}`)

  if (cf.errors.length > 0) {
    console.log('\nErrors:')
    cf.errors.forEach(err => console.log(`  - ${err}`))
  }

  console.log('\n=== First 3 Fixtures (Parsed Data) ===\n')

  for (let i = 0; i < Math.min(3, cf.data.length); i++) {
    const match = cf.data[i]
    console.log(`Fixture ${i + 1}:`)
    console.log(`  Cup Week: ${match.cupGameweek}`)
    console.log(`  Home Manager: ${match.homeManager}`)
    console.log(`  Away Manager: ${match.awayManager}`)
    console.log(`  Home Lineup:`)
    console.log(`    Player 1: ${match.homeLineup.player1} (${match.homeGoals.player1} goals)`)
    console.log(`    Player 2: ${match.homeLineup.player2} (${match.homeGoals.player2} goals)`)
    console.log(`    Player 3: ${match.homeLineup.player3} (${match.homeGoals.player3} goals)`)
    console.log(`  Away Lineup:`)
    console.log(`    Player 1: ${match.awayLineup.player1} (${match.awayGoals.player1} goals)`)
    console.log(`    Player 2: ${match.awayLineup.player2} (${match.awayGoals.player2} goals)`)
    console.log(`    Player 3: ${match.awayLineup.player3} (${match.awayGoals.player3} goals)`)
    console.log(`  Is Completed: ${match.isCompleted}`)
    console.log()
  }

  // Count fixtures with goals
  let fixturesWithGoals = 0
  let totalGoals = 0

  for (const match of cf.data) {
    const homeGoals = [match.homeGoals.player1, match.homeGoals.player2, match.homeGoals.player3].filter(g => g !== undefined).length
    const awayGoals = [match.awayGoals.player1, match.awayGoals.player2, match.awayGoals.player3].filter(g => g !== undefined).length

    if (homeGoals > 0 || awayGoals > 0) {
      fixturesWithGoals++
      totalGoals += homeGoals + awayGoals
    }
  }

  console.log(`\n=== Goals Summary ===`)
  console.log(`Fixtures with at least one goal value: ${fixturesWithGoals}/${cf.data.length}`)
  console.log(`Total goal values specified: ${totalGoals}`)
}

debugCupImport()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
