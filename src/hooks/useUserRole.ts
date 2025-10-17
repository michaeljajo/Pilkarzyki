import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { UserRole } from '@/types'

export function useUserRole() {
  const { user, isLoaded } = useUser()
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbChecked, setDbChecked] = useState(false)

  useEffect(() => {
    async function checkUserRole() {
      if (!isLoaded) {
        return // Still loading Clerk auth
      }

      if (!user) {
        setRole(null)
        setLoading(false)
        return
      }

      try {
        // First check Clerk metadata for quick response
        const metadataAdmin = user.publicMetadata?.isAdmin === true

        if (metadataAdmin) {
          setRole('admin')
          setLoading(false)
          return
        }

        // If not in metadata, check database
        if (!dbChecked) {
          const response = await fetch('/api/user/role')
          if (response.ok) {
            const data = await response.json()
            const isAdmin = data.isAdmin || false
            setRole(isAdmin ? 'admin' : 'manager')
            setDbChecked(true)
          } else if (response.status === 401 || response.status === 403) {
            // User is not authenticated - this should not happen if middleware is working
            // but handle it gracefully
            console.warn('User not authenticated when checking role')
            setRole(null)
          } else {
            // Other API error - fallback to manager
            console.warn('API error when checking role:', response.status)
            setRole('manager')
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        // Fallback: treat as manager if there's an error
        setRole('manager')
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [isLoaded, user, dbChecked])

  return {
    role,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    loading,
    user
  }
}