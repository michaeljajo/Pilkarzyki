import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { AdminGuardResult } from '@/lib/auth-helpers'

type MutabilityResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

/**
 * League and cup manual tiebreakers are the same feature over two tables.
 * The route files were 189 lines each and differed only in the table name,
 * the scope column, and which pair of guards they called — no logic differed.
 *
 * Note the tables are genuinely separate (manual_tiebreakers /
 * cup_manual_tiebreakers), so this parameterises the handlers rather than
 * merging any data.
 */
export interface TiebreakerCompetition {
  /** Table holding the tiebreakers. */
  table: 'manual_tiebreakers' | 'cup_manual_tiebreakers'
  /** Column scoping a row to its competition. */
  scopeColumn: 'league_id' | 'cup_id'
  /** Used in error logs, e.g. "cup manual tiebreakers". */
  label: string
  /** Admin guard resolving the owning league from this competition's id. */
  requireAdmin: (clerkUserId: string, id: string) => Promise<AdminGuardResult>
  /** Archived-season guard for this competition's id. */
  assertMutable: (id: string) => Promise<MutabilityResult>
}

interface TiebreakerInput {
  manager_id?: string
  tiebreaker_value?: number
}

/**
 * Builds the GET / PUT / DELETE handlers for a competition's manual
 * tiebreakers.
 *
 * Guard ordering is preserved from the original routes and is load-bearing:
 * authenticate, then authorize, then reject archived seasons, then validate
 * the body. Authorizing before reading the body keeps a non-admin from
 * learning anything about the competition.
 */
export function createManualTiebreakerHandlers(competition: TiebreakerCompetition) {
  const { table, scopeColumn, label, requireAdmin, assertMutable } = competition

  const selectColumns = `
        id,
        ${scopeColumn},
        manager_id,
        tiebreaker_value,
        created_at,
        updated_at
      `

  async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params

      const { data: tiebreakers, error } = await supabaseAdmin
        .from(table)
        .select(selectColumns)
        .eq(scopeColumn, id)
        .order('tiebreaker_value', { ascending: true })

      if (error) {
        console.error(`Error fetching ${label}:`, error)
        return NextResponse.json(
          { error: 'Failed to fetch manual tiebreakers' },
          { status: 500 }
        )
      }

      return NextResponse.json({ tiebreakers: tiebreakers || [] })
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params

      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const admin = await requireAdmin(userId, id)
      if (!admin.ok) {
        return NextResponse.json({ error: admin.error }, { status: admin.status })
      }

      const body = await request.json()
      const { tiebreakers } = body

      if (!Array.isArray(tiebreakers)) {
        return NextResponse.json(
          { error: 'tiebreakers must be an array' },
          { status: 400 }
        )
      }

      const mutable = await assertMutable(id)
      if (!mutable.ok) {
        return NextResponse.json({ error: mutable.error }, { status: mutable.status })
      }

      for (const tb of tiebreakers as TiebreakerInput[]) {
        if (!tb.manager_id || typeof tb.tiebreaker_value !== 'number' || tb.tiebreaker_value < 1) {
          return NextResponse.json(
            { error: 'Each tiebreaker must have manager_id and tiebreaker_value (positive integer)' },
            { status: 400 }
          )
        }
      }

      // Replace wholesale: clear the competition's rows, then insert the new set.
      const { error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(scopeColumn, id)

      if (deleteError) {
        console.error('Error deleting existing tiebreakers:', deleteError)
        return NextResponse.json(
          { error: 'Failed to clear existing tiebreakers' },
          { status: 500 }
        )
      }

      if (tiebreakers.length > 0) {
        const rows = (tiebreakers as TiebreakerInput[]).map((tb) => ({
          [scopeColumn]: id,
          manager_id: tb.manager_id,
          tiebreaker_value: tb.tiebreaker_value,
        }))

        const { error: insertError } = await supabaseAdmin.from(table).insert(rows)

        if (insertError) {
          console.error('Error inserting tiebreakers:', insertError)
          return NextResponse.json(
            { error: 'Failed to save tiebreakers' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Manual tiebreakers updated successfully',
      })
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params

      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const admin = await requireAdmin(userId, id)
      if (!admin.ok) {
        return NextResponse.json({ error: admin.error }, { status: admin.status })
      }

      const mutable = await assertMutable(id)
      if (!mutable.ok) {
        return NextResponse.json({ error: mutable.error }, { status: mutable.status })
      }

      const { error } = await supabaseAdmin.from(table).delete().eq(scopeColumn, id)

      if (error) {
        console.error('Error deleting tiebreakers:', error)
        return NextResponse.json(
          { error: 'Failed to delete tiebreakers' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Manual tiebreakers cleared successfully',
      })
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return { GET, PUT, DELETE }
}
