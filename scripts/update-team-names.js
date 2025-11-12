/**
 * Script to update team names in squads table from Excel migration file
 * Run with: node scripts/update-team-names.js path/to/your/migration-file.xlsx league-id
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTeamNames(filePath, leagueId) {
  console.log('Reading Excel file:', filePath);
  console.log('League ID:', leagueId);
  console.log('');

  // Read Excel file
  const workbook = XLSX.readFile(filePath);

  if (!workbook.SheetNames.includes('Managers_Mapping')) {
    console.error('Error: Managers_Mapping sheet not found in Excel file');
    process.exit(1);
  }

  const sheet = workbook.Sheets['Managers_Mapping'];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} team names in Managers_Mapping sheet\n`);

  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    process.exit(1);
  }

  console.log(`Found ${users.length} users in database\n`);

  // Create email to user ID map
  const userMap = new Map();
  users.forEach(user => {
    userMap.set(user.email.toLowerCase(), user);
  });

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const row of data) {
    const teamName = row['Team Name'];
    const managerEmail = row['Manager'];

    if (!teamName || !managerEmail) {
      console.log(`⚠️  Skipping row: missing Team Name or Manager`);
      continue;
    }

    const user = userMap.get(managerEmail.toLowerCase().trim());

    if (!user) {
      console.log(`❌ Manager not found: ${managerEmail}`);
      notFound++;
      continue;
    }

    // Find squad for this manager in this league
    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .select('id, team_name')
      .eq('manager_id', user.id)
      .eq('league_id', leagueId)
      .single();

    if (squadError || !squad) {
      console.log(`❌ Squad not found for ${user.first_name} ${user.last_name} (${managerEmail})`);
      notFound++;
      continue;
    }

    // Update squad with team name
    const { error: updateError } = await supabase
      .from('squads')
      .update({ team_name: teamName })
      .eq('id', squad.id);

    if (updateError) {
      console.log(`❌ Error updating "${teamName}" for ${managerEmail}:`, updateError.message);
      errors++;
    } else {
      console.log(`✅ Updated: "${teamName}" for ${user.first_name} ${user.last_name} (${managerEmail})`);
      updated++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Not found: ${notFound}`);
  console.log(`⚠️  Errors: ${errors}`);
  console.log(`📊 Total: ${data.length}`);
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/update-team-names.js <path-to-excel-file> <league-id>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/update-team-names.js ~/Downloads/migration.xlsx 8b6d933e-e011-4fd5-8bc0-8344e2841192');
  process.exit(1);
}

const [filePath, leagueId] = args;

updateTeamNames(filePath, leagueId)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
  });
