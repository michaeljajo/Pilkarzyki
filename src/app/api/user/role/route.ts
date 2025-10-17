import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin in database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (error) {
      // If user doesn't exist in database, they're not an admin
      if (error.code === 'PGRST116') {
        return NextResponse.json({ isAdmin: false })
      }
      console.error('Error checking user role:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      isAdmin: user?.is_admin || false
    })
  } catch (error) {
    console.error('Error in /api/user/role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}