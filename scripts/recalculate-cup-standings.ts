import { supabaseAdmin } from '../src/lib/supabase'
import { recalculateCupGroupStandings } from '../src/utils/standings-calculator'

async function main() {
  try {
    console.log('Fetching all cups...')

    // Get all cups
    const { data: cups, error } = await supabaseAdmin
      .from('cups')
      .select('id, name, league_id, stage')

    if (error) {
      console.error('Error fetching cups:', error)
      process.exit(1)
    }

    if (!cups || cups.length === 0) {
      console.log('No cups found')
      process.exit(0)
    }

    console.log(`Found ${cups.length} cup(s)`)

    for (const cup of cups) {
      console.log(`\nProcessing cup: ${cup.name} (${cup.id})`)
      console.log(`  Stage: ${cup.stage}`)

      try {
        await recalculateCupGroupStandings(cup.id)
        console.log(`  ✓ Successfully recalculated standings for ${cup.name}`)
      } catch (error) {
        console.error(`  ✗ Error recalculating standings for ${cup.name}:`, error)
      }
    }

    console.log('\n✓ Done!')
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
