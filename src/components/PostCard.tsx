'use client'

import { useState } from 'react'
import { PostWithUser } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Trash2, Edit2, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

interface PostCardProps {
  post: PostWithUser
  currentUserId: string
  isLeagueAdmin: boolean
  onDelete: (postId: string) => Promise<void>
  onEdit: (postId: string, content: string) => Promise<void>
}

export function PostCard({ post, currentUserId, isLeagueAdmin, onDelete, onEdit }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isSaving, setIsSaving] = useState(false)

  const isAuthor = post.user_id === currentUserId
  const canDelete = isAuthor || isLeagueAdmin
  const canEdit = isAuthor

  const userName = post.users
    ? `${post.users.first_name || ''} ${post.users.last_name || ''}`.trim() || post.users.email
    : 'Unknown User'

  const createdDate = format(new Date(post.created_at), 'dd.MM.yyyy, HH:mm', { locale: pl })
  const isEdited = post.updated_at && post.updated_at !== post.created_at
  const editedDate = isEdited ? format(new Date(post.updated_at), 'dd.MM.yyyy, HH:mm', { locale: pl }) : null

  const handleDelete = async () => {
    if (confirm('Czy na pewno chcesz usunąć ten post?')) {
      await onDelete(post.id)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(post.content)
  }

  const handleSave = async () => {
    if (!editContent.trim() || editContent === post.content) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onEdit(post.id, editContent.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Error editing post:', error)
      alert('Nie udało się edytować wiadomości')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditContent(post.content)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div style={{ padding: '24px' }}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">{userName}</h4>
            <p className="text-sm text-gray-500">{createdDate}</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !editContent.trim()}
                  icon={<Save size={16} />}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                  icon={<X size={16} />}
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                />
              </>
            ) : (
              <>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    icon={<Edit2 size={16} />}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  />
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    icon={<Trash2 size={16} />}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  />
                )}
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-transparent resize-none"
            rows={4}
            disabled={isSaving}
          />
        ) : (
          <>
            <p className="text-gray-700 whitespace-pre-wrap break-words">{post.content}</p>
            {isEdited && editedDate && (
              <p className="text-xs text-gray-400 mt-2 italic">
                Edytowano: {editedDate}
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
