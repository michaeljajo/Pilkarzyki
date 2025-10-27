import { supabaseAdmin } from '../src/lib/supabase'

async function setAdmin() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_admin: true })
    .eq('clerk_id', 'user_32pS3FW4pT72RQayyd2vofTJ3L4')
    .select()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success! Updated user:', data)
  }
}

setAdmin()
