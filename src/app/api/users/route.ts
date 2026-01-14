import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clerkClient()
    // Fetch ALL users by setting a high limit (Clerk max is 500 per request)
    const users = await client.users.getUserList({
      limit: 500
    })

    // Check for email duplicates in raw data
    const emailCounts = users.data.reduce((acc, user) => {
      const email = user.emailAddresses[0]?.emailAddress || ''
      acc[email] = (acc[email] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const duplicateEmails = Object.entries(emailCounts).filter(([_, count]) => count > 1)
    if (duplicateEmails.length > 0) {

      // Log detailed info for duplicates
      duplicateEmails.forEach(([email, count]) => {
        const duplicateUsers = users.data.filter(user =>
          user.emailAddresses[0]?.emailAddress === email
        )
      })
    }

    // Deduplicate users by email - keep the most recent/active one
    const deduplicatedUsers = users.data.reduce((acc, user) => {
      const email = user.emailAddresses[0]?.emailAddress || ''

      if (!email) {
        // Skip users without email
        return acc
      }

      const existing = acc.find(u => u.emailAddresses[0]?.emailAddress === email)

      if (!existing) {
        // First occurrence of this email
        acc.push(user)
      } else {
        // Decide which user to keep based on priority:
        // 1. Most recent sign-in (if available)
        // 2. Most recent creation date
        // 3. User with more complete profile data

        const existingLastSignIn = existing.lastSignInAt ? new Date(existing.lastSignInAt) : new Date(0)
        const currentLastSignIn = user.lastSignInAt ? new Date(user.lastSignInAt) : new Date(0)

        const existingCreated = new Date(existing.createdAt)
        const currentCreated = new Date(user.createdAt)

        const existingCompleteness = (existing.firstName ? 1 : 0) + (existing.lastName ? 1 : 0) + (existing.username ? 1 : 0)
        const currentCompleteness = (user.firstName ? 1 : 0) + (user.lastName ? 1 : 0) + (user.username ? 1 : 0)

        let shouldReplace = false

        // Priority 1: Most recent sign-in
        if (currentLastSignIn.getTime() > existingLastSignIn.getTime()) {
          shouldReplace = true
        } else if (currentLastSignIn.getTime() === existingLastSignIn.getTime()) {
          // Priority 2: More complete profile
          if (currentCompleteness > existingCompleteness) {
            shouldReplace = true
          } else if (currentCompleteness === existingCompleteness) {
            // Priority 3: More recent creation
            if (currentCreated.getTime() > existingCreated.getTime()) {
              shouldReplace = true
            }
          }
        }

        if (shouldReplace) {
          // Replace the existing user
          const index = acc.findIndex(u => u.emailAddresses[0]?.emailAddress === email)
          acc[index] = user
        } else {
        }
      }

      return acc
    }, [] as typeof users.data)


    // Transform deduplicated users to match our expected format
    const transformedUsers = deduplicatedUsers.map(user => ({
      id: user.id,
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      isAdmin: user.publicMetadata?.isAdmin === true,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    }))


    return NextResponse.json({ users: transformedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, firstName, lastName, isAdmin, password } = await request.json()

    const client = await clerkClient()

    const newUser = await client.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      password,
      publicMetadata: {
        isAdmin: isAdmin || false
      }
    })

    const transformedUser = {
      id: newUser.id,
      clerkId: newUser.id,
      email: newUser.emailAddresses[0]?.emailAddress || '',
      firstName: newUser.firstName || '',
      lastName: newUser.lastName || '',
      isAdmin: newUser.publicMetadata?.isAdmin === true,
      createdAt: new Date(newUser.createdAt),
      updatedAt: new Date(newUser.updatedAt)
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}