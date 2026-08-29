import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveUserNames } from '@/utils/name-resolver'
import {
  addLeagueAdmin,
  removeLeagueAdmin,
  requireLeagueAdmin,
} from '@/lib/auth-helpers'
import { LEAGUE_LIMITS } from '@/config/constants'
import { logger } from '@/lib/logger'

/**
 * Per-league administrator management.
 *
 * There is no global admin in this app: rights are granted per league through
 * the `league_admins` junction table, and only an existing admin of *that*
 * league may grant or revoke them. Every handler here is therefore guarded by
 * requireLeagueAdmin against the league in the URL.
 *
 * Note this is deliberately *not* gated on assertLeagueMutable: an archived
 * season is read-only for competitive data (results, lineups, cup), but its
 * access list must stay editable so an admin can still hand over or clean up a
 * finished season.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Hard cap on admins per league, mirrored in the UI copy. */
const MAX_LEAGUE_ADMINS = LEAGUE_LIMITS.MAX_ADMINS

interface AdminRow {
  user_id: string
  created_at: string | null
  users: {
    id: string
    clerk_id: string | null
    email: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

/**
 * The client identifies people by Clerk ID (that is what /api/users returns),
 * while `league_admins.user_id` is a `users.id` UUID. Accept either form and
 * return the database id, so a Clerk ID never reaches a uuid comparison.
 */
async function resolveUserDbId(userId: string): Promise<string | null> {
  if (UUID_PATTERN.test(userId)) {
    return userId
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .maybeSingle()

  if (error) {
    logger.error('Admins: failed to resolve user id:', error)
    return null
  }

  return data?.id ?? null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id: leagueId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guard = await requireLeagueAdmin(userId, leagueId)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    const { data, error } = await supabaseAdmin
      .from('league_admins')
      .select(`
        user_id,
        created_at,
        users!league_admins_user_id_fkey(
          id,
          clerk_id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Admins GET - DB error:', error)
      return NextResponse.json({ error: 'Nie udało się wczytać administratorów' }, { status: 500 })
    }

    const rows = ((data || []) as unknown as AdminRow[]).filter((row) => row.users)
    const clerkIds = rows.map((row) => row.users?.clerk_id).filter(Boolean) as string[]

    // Same GDPR rule as the managers endpoint: never ship email addresses to
    // the client, only a non-identifying display label. Batch-load the Clerk
    // profiles so placeholder mirror rows (<prefix>@temp.com) never leak.

    const clerkById = new Map<string, any>()
    if (clerkIds.length > 0) {
      try {
        const client = await clerkClient()
        const list = await client.users.getUserList({ userId: clerkIds, limit: clerkIds.length })
        for (const cu of list.data) clerkById.set(cu.id, cu)
      } catch (e) {
        logger.warn('Admins GET - Clerk batch lookup failed:', e)
      }
    }

    const admins = rows.map((row) => {
      const user = row.users!
      const clerkUser = user.clerk_id ? clerkById.get(user.clerk_id) : undefined

      const realEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || ''
      const dbEmail =
        typeof user.email === 'string' && !user.email.endsWith('@temp.com') ? user.email : ''
      const email = realEmail || dbEmail

      const { firstName } = resolveUserNames({
        email,
        first_name: clerkUser ? clerkUser.firstName : user.first_name,
        last_name: clerkUser ? clerkUser.lastName : user.last_name,
        username: clerkUser?.username,
      })

      return {
        id: user.clerk_id || user.id,
        clerkId: user.clerk_id,
        databaseId: user.id,
        displayName: clerkUser?.username || email.split('@')[0] || firstName || 'Użytkownik',
        isSelf: user.clerk_id === userId,
        createdAt: row.created_at,
      }
    })

    return NextResponse.json({ admins, maxAdmins: MAX_LEAGUE_ADMINS })
  } catch (error) {
    logger.error('Admins GET catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: authUserId } = await auth()
    const { id: leagueId } = await params

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guard = await requireLeagueAdmin(authUserId, leagueId)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    const { userId } = await request.json()

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Brak identyfikatora użytkownika.' }, { status: 400 })
    }

    let targetDbId = await resolveUserDbId(userId)

    // The picker lists every registered Clerk user, and someone who has never
    // opened a league has no mirror row yet — create it, exactly as the
    // "add manager" flow does.
    if (!targetDbId && !UUID_PATTERN.test(userId)) {
      try {
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(userId)
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const { firstName, lastName } = resolveUserNames({
          email,
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          username: clerkUser.username,
        })

        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            is_admin: false, // no global admin: rights are per-league via league_admins
          })
          .select('id')
          .single()

        if (createError) {
          logger.error('Admins POST - failed to create user:', createError)
          return NextResponse.json({ error: 'Nie udało się utworzyć użytkownika' }, { status: 500 })
        }

        targetDbId = newUser.id
      } catch (clerkError) {
        logger.error('Admins POST - Clerk lookup failed:', clerkError)
        return NextResponse.json({ error: 'Nie znaleziono użytkownika' }, { status: 404 })
      }
    }

    if (!targetDbId) {
      return NextResponse.json({ error: 'Nie znaleziono użytkownika' }, { status: 404 })
    }

    const result = await addLeagueAdmin(
      leagueId,
      targetDbId,
      guard.userInternalId,
      MAX_LEAGUE_ADMINS
    )

    if (!result.success) {
      const message =
        result.error === 'User is already an admin of this league'
          ? 'Ten użytkownik jest już administratorem tej ligi.'
          : result.error?.startsWith('Maximum of')
            ? `Osiągnięto maksymalną liczbę administratorów (${MAX_LEAGUE_ADMINS}).`
            : 'Nie udało się nadać uprawnień administratora.'
      const status = result.error === 'User is already an admin of this league' ? 409 : 400
      return NextResponse.json({ error: message }, { status })
    }

    // The dashboard league list is built from league_admins as well as squads,
    // so the new admin must see the league without waiting for the cache.
    revalidateTag('user-leagues', 'max')
    revalidatePath('/leagues')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Admins POST catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: authUserId } = await auth()
    const { id: leagueId } = await params

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guard = await requireLeagueAdmin(authUserId, leagueId)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    const { userId } = await request.json()

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Brak identyfikatora użytkownika.' }, { status: 400 })
    }

    const targetDbId = await resolveUserDbId(userId)

    if (!targetDbId) {
      return NextResponse.json({ error: 'Nie znaleziono użytkownika' }, { status: 404 })
    }

    const result = await removeLeagueAdmin(leagueId, targetDbId)

    if (!result.success) {
      const message =
        result.error === 'Cannot remove the last admin'
          ? 'Nie można odebrać uprawnień ostatniemu administratorowi ligi.'
          : 'Nie udało się odebrać uprawnień administratora.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    revalidateTag('user-leagues', 'max')
    revalidatePath('/leagues')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Admins DELETE catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
