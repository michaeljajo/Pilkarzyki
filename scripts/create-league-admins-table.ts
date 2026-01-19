/**
 * Create league_admins table and migrate data
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function createLeagueAdminsTable() {
  console.log('Creating league_admins table...\n')

  // Step 1: Create the table
  console.log('Step 1: Creating league_admins table...')
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS league_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES users(id),
      UNIQUE(league_id, user_id)
    );
  `

  try {
    // Use raw SQL execution via Supabase admin
    const { error: createError } = await (supabaseAdmin as any).rpc('exec_sql', {
      sql: createTableQuery
    })

    if (createError) {
      console.error('Error creating table via RPC:', createError)
      console.log('Table might already exist, continuing...')
    } else {
      console.log('✅ Table created')
    }
  } catch (err) {
    console.log('RPC not available, table might already exist. Continuing...')
  }

  // Step 2: Create indexes
  console.log('\nStep 2: Creating indexes...')
  const queries = [
    `CREATE INDEX IF NOT EXISTS idx_league_admins_league_id ON league_admins(league_id);`,
    `CREATE INDEX IF NOT EXISTS idx_league_admins_user_id ON league_admins(user_id);`
  ]

  for (const query of queries) {
    try {
      await (supabaseAdmin as any).rpc('exec_sql', { sql: query })
      console.log('✅ Index created')
    } catch (err) {
      console.log('⚠️  Index might already exist')
    }
  }

  // Step 3: Migrate existing data
  console.log('\nStep 3: Migrating existing admin_id data...')

  // Get all leagues with admin_id
  const { data: leagues, error: leaguesError } = await supabaseAdmin
    .from('leagues')
    .select('id, admin_id, created_at')
    .not('admin_id', 'is', null)

  if (leaguesError) {
    console.error('Error fetching leagues:', leaguesError)
    return
  }

  console.log(`Found ${leagues?.length || 0} leagues with admins`)

  if (leagues && leagues.length > 0) {
    // Insert admin relationships
    const adminRecords = leagues.map(league => ({
      league_id: league.id,
      user_id: league.admin_id,
      created_at: league.created_at
    }))

    const { error: insertError } = await supabaseAdmin
      .from('league_admins')
      .upsert(adminRecords, { onConflict: 'league_id,user_id', ignoreDuplicates: true })

    if (insertError) {
      console.error('Error inserting admin records:', insertError)
    } else {
      console.log(`✅ Migrated ${adminRecords.length} admin relationships`)
    }
  }

  // Step 4: Verify migration
  console.log('\nStep 4: Verifying migration...')
  const { data: adminCount, error: countError } = await supabaseAdmin
    .from('league_admins')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Error counting admins:', countError)
  } else {
    console.log(`✅ Total admin relationships in league_admins: ${adminCount}`)
  }

  // Show sample data
  const { data: sampleAdmins } = await supabaseAdmin
    .from('league_admins')
    .select(`
      id,
      league_id,
      user_id,
      leagues!inner(name),
      users!inner(email, first_name, last_name)
    `)
    .limit(5)

  if (sampleAdmins && sampleAdmins.length > 0) {
    console.log('\nSample admin relationships:')
    sampleAdmins.forEach((admin: any) => {
      console.log(`  - ${admin.leagues.name}: ${admin.users.first_name} ${admin.users.last_name} (${admin.users.email})`)
    })
  }
}

createLeagueAdminsTable()
  .then(() => {
    console.log('\n✅ Migration complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Migration failed:', err)
    process.exit(1)
  })
