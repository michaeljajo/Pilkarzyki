import * as XLSX from 'xlsx'

const MIGRATION_FILE_PATH = '/Users/michael/Desktop/VS Code/Pilkarzyki/migrations/migration-template (1).xlsx'

async function showExcelColumns() {
  const workbook = XLSX.readFile(MIGRATION_FILE_PATH)

  console.log(`\n=== Excel File Sheet Names ===`)
  console.log(workbook.SheetNames)
  console.log()

  // Check Cup Fixtures sheet
  if (workbook.Sheets['Cup_Fixtures_And_Results']) {
    const fixturesSheet = workbook.Sheets['Cup_Fixtures_And_Results']
    const fixturesData = XLSX.utils.sheet_to_json(fixturesSheet) as any[]

    console.log(`=== Cup_Fixtures_And_Results Sheet ===`)
    console.log(`Total rows: ${fixturesData.length}`)

    if (fixturesData.length > 0) {
      console.log(`\nColumn names (from first row):`)
      const columns = Object.keys(fixturesData[0])
      columns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. "${col}"`)
      })

      console.log(`\nFirst row data:`)
      console.log(JSON.stringify(fixturesData[0], null, 2))
    }
  } else {
    console.log(`Sheet "Cup_Fixtures_And_Results" not found!`)
    console.log(`Available sheets: ${workbook.SheetNames.join(', ')}`)
  }
}

showExcelColumns()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
