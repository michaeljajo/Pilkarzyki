import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single()


    if (error) {
      console.error('Error fetching league:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Check if user is the admin of this league
    if (data.admin_id !== userRecord.id) {
      return NextResponse.json({ error: 'Forbidden: You are not the admin of this league' }, { status: 403 })
    }

    return NextResponse.json({ league: data })
  } catch (error) {
    console.error('GET league catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if league exists and user is admin
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('admin_id')
      .eq('id', id)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    if (league.admin_id !== userRecord.id) {
      return NextResponse.json({ error: 'Forbidden: You are not the admin of this league' }, { status: 403 })
    }

    const requestBody = await request.json()

    const { name, isActive } = requestBody

    const { data, error } = await supabaseAdmin
      .from('leagues')
      .update({
        name,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()


    if (error) {
      console.error('Error updating league:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    return NextResponse.json({ league: data })
  } catch (error) {
    console.error('PUT league catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if league exists and user is admin
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('admin_id')
      .eq('id', id)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    if (league.admin_id !== userRecord.id) {
      return NextResponse.json({ error: 'Forbidden: You are not the admin of this league' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('leagues')
      .delete()
      .eq('id', id)
      .select('*')
      .single()


    if (error) {
      console.error('Error deleting league:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, league: data })
  } catch (error) {
    console.error('DELETE league catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}