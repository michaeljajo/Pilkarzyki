/**
 * Script to fix user names in the database
 * Updates users with generic "Admin User" names to use their email prefix instead
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUserNames() {
  console.log('🔍 Fetching users with generic names...')

  // Fetch all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching users:', error)
    return
  }

  console.log(`📊 Found ${users?.length || 0} users`)

  for (const user of users || []) {
    const needsUpdate =
      (user.first_name === 'Admin' && user.last_name === 'User') ||
      user.first_name === 'Admin' ||
      user.first_name === 'User' ||
      !user.first_name

    if (needsUpdate && user.email) {
      const emailPrefix = user.email.split('@')[0]

      let firstName = emailPrefix
      let lastName = ''

      // Try to split username if it has dots or underscores
      if (emailPrefix.includes('.')) {
        const parts = emailPrefix.split('.')
        firstName = parts[0]
        lastName = parts.slice(1).join(' ')
      } else if (emailPrefix.includes('_')) {
        const parts = emailPrefix.split('_')
        firstName = parts[0]
        lastName = parts.slice(1).join(' ')
      }

      // Capitalize first letter
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
      if (lastName) {
        lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1)
      }

      console.log(`\n🔄 Updating user ${user.email}:`)
      console.log(`   From: ${user.first_name} ${user.last_name}`)
      console.log(`   To: ${firstName} ${lastName}`)

      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', user.id)

      if (updateError) {
        console.error(`   ❌ Error updating user:`, updateError)
      } else {
        console.log(`   ✅ Updated successfully`)
      }
    }
  }

  console.log('\n✨ Done!')
}

fixUserNames().catch(console.error)
