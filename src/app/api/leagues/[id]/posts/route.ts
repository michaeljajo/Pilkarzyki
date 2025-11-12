import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { PostWithUser } from '@/types'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params

    // Get user's database ID from Clerk ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is a member of this league (has a squad) or is the admin
    const { data: squad } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', leagueId)
      .eq('manager_id', user.id)
      .maybeSingle()

    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('id, admin_id')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    const isAdmin = league.admin_id === user.id
    const isMember = !!squad

    if (!isAdmin && !isMember) {
      return NextResponse.json({ error: 'You are not a member of this league' }, { status: 403 })
    }

    // Fetch posts with user information, ordered by created_at DESC (most recent first)
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('posts')
      .select(`
        id,
        league_id,
        user_id,
        content,
        created_at,
        updated_at,
        users!posts_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('Error in posts GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content is too long (max 5000 characters)' }, { status: 400 })
    }

    // Get user's database ID from Clerk ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is a member of this league (has a squad) or is the admin
    const { data: squad } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', leagueId)
      .eq('manager_id', user.id)
      .maybeSingle()

    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('id, admin_id')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    const isAdmin = league.admin_id === user.id
    const isMember = !!squad

    if (!isAdmin && !isMember) {
      return NextResponse.json({ error: 'You are not a member of this league' }, { status: 403 })
    }

    // Create the post
    const { data: newPost, error: createError } = await supabaseAdmin
      .from('posts')
      .insert({
        league_id: leagueId,
        user_id: user.id,
        content: content.trim()
      })
      .select(`
        id,
        league_id,
        user_id,
        content,
        created_at,
        updated_at,
        users!posts_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single()

    if (createError) {
      console.error('Error creating post:', createError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ post: newPost }, { status: 201 })
  } catch (error) {
    console.error('Error in posts POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
