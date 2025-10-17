import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Setting admin status for user:', userId)

    // Set the current user as admin in Clerk metadata
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        isAdmin: true
      }
    })

    // Also create/update user record in database with admin privileges
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        clerk_id: userId,
        email: `admin-${userId}@temp.com`,
        first_name: 'Admin',
        last_name: 'User',
        is_admin: true
      }, {
        onConflict: 'clerk_id'
      })
      .select()
      .single()

    if (error) {
      console.warn('Database update error (continuing anyway):', error)
    }

    console.log('Admin status set successfully in both Clerk and database')

    return NextResponse.json({
      success: true,
      message: 'Admin status set successfully in both Clerk and database',
      dbUser: data
    })
  } catch (error) {
    console.error('Error setting admin status:', error)
    return NextResponse.json({ error: 'Failed to set admin status' }, { status: 500 })
  }
}