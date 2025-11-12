import * as XLSX from 'xlsx'

const MIGRATION_FILE_PATH = '/Users/michael/Desktop/VS Code/Pilkarzyki/migrations/migration-template (1).xlsx'

async function debugExcelParsing() {
  const workbook = XLSX.readFile(MIGRATION_FILE_PATH)
  const fixturesSheet = workbook.Sheets['Cup_Fixtures_And_Results']
  const fixturesData = XLSX.utils.sheet_to_json(fixturesSheet) as any[]

  console.log(`\n=== Excel Data Parsing Debug ===\n`)
  console.log(`Total fixtures: ${fixturesData.length}\n`)

  // Show first 3 fixtures with all data
  for (let i = 0; i < Math.min(3, fixturesData.length); i++) {
    const row = fixturesData[i]
    console.log(`Fixture ${i + 1}:`)
    console.log(`  Cup Gameweek: ${row['Cup_Gameweek']}`)
    console.log(`  Home Manager: ${row['Home_Manager']}`)
    console.log(`  Home Player 1: ${row['Home_Player_1']}`)
    console.log(`  Home Player 1 Goals: ${row['Home_Player_1_Goals']} (type: ${typeof row['Home_Player_1_Goals']})`)
    console.log(`  Home Player 2: ${row['Home_Player_2']}`)
    console.log(`  Home Player 2 Goals: ${row['Home_Player_2_Goals']} (type: ${typeof row['Home_Player_2_Goals']})`)
    console.log(`  Home Player 3: ${row['Home_Player_3']}`)
    console.log(`  Home Player 3 Goals: ${row['Home_Player_3_Goals']} (type: ${typeof row['Home_Player_3_Goals']})`)
    console.log(`  Away Manager: ${row['Away_Manager']}`)
    console.log(`  Away Player 1: ${row['Away_Player_1']}`)
    console.log(`  Away Player 1 Goals: ${row['Away_Player_1_Goals']} (type: ${typeof row['Away_Player_1_Goals']})`)
    console.log()
  }

  // Check how many fixtures have goals data
  let fixturesWithGoals = 0
  for (const row of fixturesData) {
    if (
      row['Home_Player_1_Goals'] !== undefined ||
      row['Home_Player_2_Goals'] !== undefined ||
      row['Home_Player_3_Goals'] !== undefined ||
      row['Away_Player_1_Goals'] !== undefined ||
      row['Away_Player_2_Goals'] !== undefined ||
      row['Away_Player_3_Goals'] !== undefined
    ) {
      fixturesWithGoals++
    }
  }

  console.log(`\nFixtures with any goals data: ${fixturesWithGoals}/${fixturesData.length}`)
}

debugExcelParsing()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
