import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveUserNames } from '@/utils/name-resolver'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

if (!webhookSecret) {
  throw new Error('CLERK_WEBHOOK_SECRET is not set in environment variables')
}

type ClerkWebhookEvent = {
  type: string
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    first_name: string
    last_name: string
    username?: string
    public_metadata?: {
      isAdmin?: boolean
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')


    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: 'Missing required headers' }, { status: 400 })
    }

    // Get the body
    const payload = await request.text()

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret!)

    let evt: ClerkWebhookEvent

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    // Handle the event
    const { type, data } = evt

    switch (type) {
      case 'user.created':
        await handleUserCreated(data)
        break
      case 'user.updated':
        await handleUserUpdated(data)
        break
      case 'user.deleted':
        await handleUserDeleted(data)
        break
      default:
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleUserCreated(userData: ClerkWebhookEvent['data']) {
  try {
    const email = userData.email_addresses[0]?.email_address || ''

      id: userData.id,
      email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username
    })

    // Use enhanced name resolution logic
    const { firstName, lastName } = resolveUserNames({
      email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username
    })

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: userData.id,
        email,
        first_name: firstName,
        last_name: lastName,
        is_admin: userData.public_metadata?.isAdmin || false
      })

    if (error) {
      console.error('❌ Error creating user in database:', error)
    } else {
    }
  } catch (error) {
    console.error('❌ Error in handleUserCreated:', error)
  }
}

async function handleUserUpdated(userData: ClerkWebhookEvent['data']) {
  try {
    const email = userData.email_addresses[0]?.email_address || ''

      id: userData.id,
      email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username
    })

    // Use enhanced name resolution logic
    const { firstName, lastName } = resolveUserNames({
      email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username
    })

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        email,
        first_name: firstName,
        last_name: lastName,
        is_admin: userData.public_metadata?.isAdmin || false,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userData.id)

    if (error) {
      console.error('❌ Error updating user in database:', error)
    } else {
    }
  } catch (error) {
    console.error('❌ Error in handleUserUpdated:', error)
  }
}

async function handleUserDeleted(userData: ClerkWebhookEvent['data']) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('clerk_id', userData.id)

    if (error) {
      console.error('Error deleting user from database:', error)
    } else {
    }
  } catch (error) {
    console.error('Error in handleUserDeleted:', error)
  }
}