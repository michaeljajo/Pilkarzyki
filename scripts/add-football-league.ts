import { supabaseAdmin } from '../src/lib/supabase'

async function addFootballLeagueColumn() {
  try {
    // Add the football_league column using a raw SQL query
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE players ADD COLUMN IF NOT EXISTS football_league TEXT;'
    })

    if (error) {
      console.error('Error adding column:', error)
      // If rpc doesn't work, try direct approach
      console.log('Trying alternative approach...')

      // Just update a single row to test if column exists
      const { error: testError } = await supabaseAdmin
        .from('players')
        .update({ football_league: null })
        .eq('id', 'test-id-that-does-not-exist')

      if (testError && testError.message.includes('column')) {
        console.error('Column does not exist and cannot be added automatically')
        console.log('Please add the column manually in Supabase dashboard:')
        console.log('ALTER TABLE players ADD COLUMN football_league TEXT;')
      } else {
        console.log('Column already exists or was added successfully')
      }
    } else {
      console.log('Successfully added football_league column')
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

addFootballLeagueColumn()
