import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClerkSupabaseClient() {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: async (url, options = {}) => {
        let clerkToken = null

        // This will be used when Clerk is loaded
        if (typeof window !== 'undefined' && window.Clerk?.session?.getToken) {
          try {
            clerkToken = await window.Clerk.session.getToken({ template: 'supabase' })
          } catch {
            // Token retrieval failed, continue without auth
          }
        }

        const headers = new Headers(options?.headers)
        if (clerkToken) {
          headers.set('Authorization', `Bearer ${clerkToken}`)
        }

        return fetch(url, {
          ...options,
          headers,
        })
      },
    },
  })
}

// Hook to use Supabase client with Clerk authentication
export function useSupabaseClient() {
  const { getToken } = useAuth()

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await getToken({ template: 'supabase' })

        const headers = new Headers(options?.headers)
        if (clerkToken) {
          headers.set('Authorization', `Bearer ${clerkToken}`)
        }

        return fetch(url, {
          ...options,
          headers,
        })
      },
    },
  })

  return supabase
}