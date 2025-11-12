import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await context.params
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

    // Get the post to check ownership
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, league_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Only the author can edit
    if (post.user_id !== user.id) {
      return NextResponse.json({ error: 'You do not have permission to edit this post' }, { status: 403 })
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabaseAdmin
      .from('posts')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
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

    if (updateError) {
      console.error('Error updating post:', updateError)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error('Error in post PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await context.params

    // Get user's database ID from Clerk ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the post to check ownership and league admin status
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, league_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user is the post author
    const isAuthor = post.user_id === user.id

    // Check if user is the league admin
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('admin_id')
      .eq('id', post.league_id)
      .single()

    const isLeagueAdmin = league?.admin_id === user.id

    // User must be either the post author or the league admin
    if (!isAuthor && !isLeagueAdmin) {
      return NextResponse.json({ error: 'You do not have permission to delete this post' }, { status: 403 })
    }

    // Delete the post
    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId)

    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error in post DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
