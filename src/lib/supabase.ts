import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Factory function to create a new Supabase client instance
// This prevents connection leaks during hot reloads in development
export function createSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

// Factory function for admin operations (server-side only)
// Creates a new client with service role key for admin operations
export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Legacy exports for backward compatibility
// DEPRECATED: Use createSupabaseClient() or createSupabaseAdminClient() instead
export const supabase = createSupabaseClient()
export const supabaseAdmin = createSupabaseAdminClient()