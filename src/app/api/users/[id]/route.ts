import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clerkClient()
    const user = await client.users.getUser(id)

    const transformedUser = {
      id: user.id,
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      isAdmin: user.publicMetadata?.isAdmin === true,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Error fetching user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if requesting user is an admin
    const client = await clerkClient()
    const requestingUser = await client.users.getUser(userId)
    const isAdmin = requestingUser.publicMetadata?.isAdmin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const updates = await request.json()

    // Build update object with only provided fields
    const clerkUpdates: any = {}
    if (updates.firstName !== undefined) {
      clerkUpdates.firstName = updates.firstName
    }
    if (updates.lastName !== undefined) {
      clerkUpdates.lastName = updates.lastName
    }
    if (updates.isAdmin !== undefined) {
      clerkUpdates.publicMetadata = {
        isAdmin: updates.isAdmin
      }
    }

    // Update user in Clerk
    const updatedUser = await client.users.updateUser(id, clerkUpdates)

    const transformedUser = {
      id: updatedUser.id,
      clerkId: updatedUser.id,
      email: updatedUser.emailAddresses[0]?.emailAddress || '',
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      isAdmin: updatedUser.publicMetadata?.isAdmin === true,
      createdAt: new Date(updatedUser.createdAt),
      updatedAt: new Date(updatedUser.updatedAt)
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if requesting user is an admin
    const client = await clerkClient()
    const requestingUser = await client.users.getUser(userId)
    const isAdmin = requestingUser.publicMetadata?.isAdmin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    await client.users.deleteUser(id)

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}