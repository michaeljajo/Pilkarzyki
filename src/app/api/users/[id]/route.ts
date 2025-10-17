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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const updates = await request.json()
    const client = await clerkClient()

    // Update user in Clerk
    const updatedUser = await client.users.updateUser(id, {
      firstName: updates.firstName,
      lastName: updates.lastName,
      publicMetadata: {
        isAdmin: updates.isAdmin
      }
    })

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const client = await clerkClient()
    await client.users.deleteUser(id)

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}