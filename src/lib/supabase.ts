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

// Lazily instantiate a client on first property access.
//
// The clients must NOT be created at module load time: Next.js imports every
// route module during the "Collecting page data" build step, and the required
// Supabase env vars are not guaranteed to be present at build time (they are
// injected at runtime). Eager construction there throws "supabaseUrl is
// required" and fails the whole production build. Deferring construction until
// the first `.from(...)`/etc. call keeps the public API identical while moving
// createClient() to runtime, where the env vars exist.
function lazyClient(factory: () => SupabaseClient): SupabaseClient {
  let instance: SupabaseClient | null = null
  return new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
      if (!instance) instance = factory()
      const value = Reflect.get(instance as object, prop, receiver)
      return typeof value === 'function' ? value.bind(instance) : value
    },
  })
}

// Legacy exports for backward compatibility
// DEPRECATED: Use createSupabaseClient() or createSupabaseAdminClient() instead
export const supabase = lazyClient(createSupabaseClient)
export const supabaseAdmin = lazyClient(createSupabaseAdminClient)