import { supabaseAdmin } from '../src/lib/supabase'
import * as XLSX from 'xlsx'

const MIGRATION_FILE_PATH = '/Users/michael/Desktop/VS Code/Pilkarzyki/migrations/migration-template (1).xlsx'

async function findMissingCupPlayers() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  // Get the most recent cup
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', wncLeagueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!cup) return

  // Get incomplete lineups
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week')
    .eq('cup_id', cup.id)
    .order('cup_week')

  console.log(`\n=== Finding Missing Players ===\n`)

  const incompleteLineups: Array<{
    cupWeek: number
    email: string
    playerCount: number
  }> = []

  for (const cgw of cupGameweeks || []) {
    const { data: lineups } = await supabaseAdmin
      .from('cup_lineups')
      .select('manager_id, player_ids')
      .eq('cup_gameweek_id', cgw.id)

    for (const lineup of lineups?.filter(l => (l.player_ids?.length || 0) < 3) || []) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', lineup.manager_id)
        .single()

      if (user) {
        incompleteLineups.push({
          cupWeek: cgw.cup_week,
          email: user.email,
          playerCount: lineup.player_ids?.length || 0
        })
      }
    }
  }

  // Now check the Excel file to see what players should have been imported
  const workbook = XLSX.readFile(MIGRATION_FILE_PATH)
  const fixturesSheet = workbook.Sheets['Cup_Fixtures_And_Results']
  const fixturesData = XLSX.utils.sheet_to_json(fixturesSheet) as any[]

  console.log(`Found ${incompleteLineups.length} incomplete lineups:\n`)

  for (const incomplete of incompleteLineups) {
    console.log(`Cup Week ${incomplete.cupWeek} - ${incomplete.email} (${incomplete.playerCount}/3 players)`)

    // Find this manager's fixture in the Excel file
    const fixture = fixturesData.find((row: any) => {
      const cupWeek = row['Cup_Gameweek']
      const homeManager = row['Home_Manager']?.toLowerCase().trim()
      const awayManager = row['Away_Manager']?.toLowerCase().trim()
      const managerEmail = incomplete.email.toLowerCase().trim()

      return cupWeek === incomplete.cupWeek && (homeManager === managerEmail || awayManager === managerEmail)
    })

    if (fixture) {
      const isHome = fixture['Home_Manager']?.toLowerCase().trim() === incomplete.email.toLowerCase().trim()
      const prefix = isHome ? 'Home' : 'Away'

      const player1 = fixture[`${prefix}_Player_1`]
      const player2 = fixture[`${prefix}_Player_2`]
      const player3 = fixture[`${prefix}_Player_3`]

      console.log(`  Expected lineup from Excel:`)
      console.log(`    1. ${player1 || 'N/A'}`)
      console.log(`    2. ${player2 || 'N/A'}`)
      console.log(`    3. ${player3 || 'N/A'}`)

      // Check which players exist in database
      const { data: league } = await supabaseAdmin
        .from('leagues')
        .select('name')
        .eq('id', wncLeagueId)
        .single()

      const { data: players } = await supabaseAdmin
        .from('players')
        .select('id, name, surname, manager_id, league')
        .eq('league', league?.name || '')

      const playerMap = new Map<string, any>()
      players?.forEach(p => {
        const fullName = `${p.name} ${p.surname}`.toLowerCase().trim()
        playerMap.set(fullName, p)
      })

      console.log(`  Database check:`)
      const checkPlayer = (name: string) => {
        if (!name) return
        const normalizedName = name.toLowerCase().trim()
        const player = playerMap.get(normalizedName)
        if (player) {
          console.log(`    ✓ ${name} - Found in database`)
        } else {
          console.log(`    ✗ ${name} - NOT FOUND in database`)
          // Check for similar names
          const similar = Array.from(playerMap.keys()).filter(n =>
            n.includes(normalizedName.split(' ')[0]) || normalizedName.includes(n.split(' ')[0])
          )
          if (similar.length > 0) {
            console.log(`      Similar names: ${similar.slice(0, 3).join(', ')}`)
          }
        }
      }

      checkPlayer(player1)
      checkPlayer(player2)
      checkPlayer(player3)
    }

    console.log()
  }
}

findMissingCupPlayers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
