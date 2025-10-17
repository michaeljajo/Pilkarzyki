import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { userAdminsAnyLeague } from '@/lib/auth-helpers'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'

interface AdminLayoutProps {
  children: ReactNode
}

async function checkAdminAccess(userId: string) {
  try {
    // Check if user is admin of ANY league (not global admin)
    return await userAdminsAnyLeague(userId)
  } catch (error) {
    console.error('Error in admin access check:', error)
    return false
  }
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const isAdmin = await checkAdminAccess(userId)

  if (!isAdmin) {
    // Return access denied page instead of redirecting
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need admin privileges to access this area.</p>
          <a
            href="/dashboard"
            className="inline-block text-indigo-600 hover:text-indigo-500"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  )
}