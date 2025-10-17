import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and admin
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔄 Starting name migration for users with empty names...')

    // Find users with empty first_name or last_name
    const { data: usersToUpdate, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id, email, first_name, last_name')
      .or('first_name.eq.,last_name.eq.')

    if (fetchError) {
      console.error('Error fetching users to update:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!usersToUpdate || usersToUpdate.length === 0) {
      console.log('✅ No users with empty names found')
      return NextResponse.json({
        message: 'No users with empty names found',
        updated: 0
      })
    }

    console.log(`Found ${usersToUpdate.length} users with empty names:`, usersToUpdate)

    const updates = []

    for (const user of usersToUpdate) {
      // Generate names from email if they're empty
      const emailPrefix = user.email?.split('@')[0] || 'User'
      const firstName = user.first_name || emailPrefix
      const lastName = user.last_name || ''

      console.log(`Updating user ${user.email}: "${user.first_name}" "${user.last_name}" -> "${firstName}" "${lastName}"`)

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error(`Error updating user ${user.email}:`, updateError)
      } else {
        updates.push({
          email: user.email,
          old: { first_name: user.first_name, last_name: user.last_name },
          new: { first_name: firstName, last_name: lastName }
        })
      }
    }

    console.log(`✅ Migration completed. Updated ${updates.length} users.`)

    return NextResponse.json({
      message: `Successfully updated ${updates.length} users`,
      updated: updates.length,
      details: updates
    })

  } catch (error) {
    console.error('Error in name migration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}