'use client'

import { useState, useCallback } from 'react'
import { PostWithUser } from '@/types'
import { PostForm } from './PostForm'
import { PostList } from './PostList'

interface TablicaClientProps {
  leagueId: string
  currentUserId: string
  isLeagueAdmin: boolean
  initialPosts: PostWithUser[]
}

export function TablicaClient({ leagueId, currentUserId, isLeagueAdmin, initialPosts }: TablicaClientProps) {
  const [posts, setPosts] = useState<PostWithUser[]>(initialPosts)

  const handlePostCreated = useCallback(async () => {
    // Fetch updated posts
    try {
      const response = await fetch(`/api/leagues/${leagueId}/posts`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }, [leagueId])

  return (
    <>
      {/* Post Form */}
      <div className="mb-8">
        <PostForm leagueId={leagueId} onPostCreated={handlePostCreated} />
      </div>

      {/* Posts List */}
      <PostList
        leagueId={leagueId}
        currentUserId={currentUserId}
        isLeagueAdmin={isLeagueAdmin}
        initialPosts={posts}
      />
    </>
  )
}
