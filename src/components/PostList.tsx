'use client'

import { useState, useEffect } from 'react'
import { PostWithUser } from '@/types'
import { PostCard } from './PostCard'
import { EmptyState } from './ui/EmptyState'
import { MessageCircle } from 'lucide-react'

interface PostListProps {
  leagueId: string
  currentUserId: string
  isLeagueAdmin: boolean
  initialPosts: PostWithUser[]
}

export function PostList({ leagueId, currentUserId, isLeagueAdmin, initialPosts }: PostListProps) {
  const [posts, setPosts] = useState<PostWithUser[]>(initialPosts)

  // Update posts when initialPosts changes
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const handleDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete post')
      }

      // Remove post from local state
      setPosts(posts.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Nie udało się usunąć wiadomości')
    }
  }

  const handleEdit = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to edit post')
      }

      const { post: updatedPost } = await response.json()

      // Update post in local state
      setPosts(posts.map(post =>
        post.id === postId ? updatedPost : post
      ))
    } catch (error) {
      console.error('Error editing post:', error)
      throw error // Re-throw to let PostCard handle it
    }
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle size={48} />}
        title="Brak wiadomości"
        description="Bądź pierwszy i napisz coś na tablicy!"
      />
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          isLeagueAdmin={isLeagueAdmin}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      ))}
    </div>
  )
}
