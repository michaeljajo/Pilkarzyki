import { supabaseAdmin } from '../src/lib/supabase'

async function fixAdminEmail() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      email: 'michaeljajo@gmail.com',
      first_name: 'Michael',
      last_name: 'Zoltowski'
    })
    .eq('clerk_id', 'user_32pS3FW4pT72RQayyd2vofTJ3L4')
    .select()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success! Updated user:', data)
  }
}

fixAdminEmail()
