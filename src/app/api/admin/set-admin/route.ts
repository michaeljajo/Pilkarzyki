import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveUserNames } from '@/utils/name-resolver'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Bootstrap-only endpoint. /setup-admin is a public route, so without this
    // gate any authenticated manager could promote themselves to global admin.
    // Promotion is allowed only while no global admin exists; afterwards,
    // admin rights are granted through the league_admins flows.
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_admin', true)

    if (countError) {
      console.error('set-admin: failed to count existing admins', countError)
      return NextResponse.json(
        { error: 'Failed to verify administrator state' },
        { status: 500 }
      )
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'An administrator already exists' },
        { status: 403 }
      )
    }

    // Set the current user as admin in Clerk metadata
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        isAdmin: true
      }
    })

    // Sync the real Clerk profile into our mirror instead of fabricating a
    // placeholder ("Admin User" / admin-<id>@temp.com), which used to clobber
    // the user's real identity everywhere the DB mirror is read.
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress || ''
    const { firstName, lastName } = resolveUserNames({
      email,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      username: clerkUser.username,
    })

    // Also create/update user record in database with admin privileges
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        clerk_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        is_admin: true
      }, {
        onConflict: 'clerk_id'
      })
      .select()
      .single()

    if (error) {
      logger.warn('Database update error (continuing anyway):', error)
    }


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