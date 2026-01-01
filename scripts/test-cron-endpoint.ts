/**
 * Test script to verify the cron endpoint is working
 * This simulates what the Vercel cron job should be doing
 */

async function testCronEndpoint() {
  console.log('\n=== Testing Cron Endpoint Locally ===\n')

  // Get the CRON_SECRET from environment
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable is not set')
    console.log('\nYou need to add CRON_SECRET to your .env.local file for local testing:')
    console.log('CRON_SECRET=f37fad2c0c90a2ef49ab44d1819a4e88f32aca89c5c8c3f45bc63c9c3ea74694')
    return
  }

  console.log('✅ CRON_SECRET is set')
  console.log(`Secret (first 10 chars): ${cronSecret.substring(0, 10)}...`)

  // Test the endpoint locally (assuming dev server is running)
  const url = 'http://localhost:3000/api/cron/complete-gameweeks'

  console.log(`\nCalling: ${url}`)
  console.log('Headers: Authorization: Bearer [secret]\n')

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`)
      console.error('Response:', JSON.stringify(data, null, 2))
      return
    }

    console.log('✅ Endpoint responded successfully!\n')
    console.log('Response:')
    console.log(JSON.stringify(data, null, 2))

    if (data.completed > 0) {
      console.log(`\n🎉 Successfully completed ${data.completed} gameweek(s)!`)
    } else {
      console.log('\n✅ No gameweeks needed completion (system is up to date)')
    }

  } catch (error) {
    console.error('❌ Error calling endpoint:', error)
    console.log('\n⚠️  Make sure your development server is running (npm run dev)')
  }
}

testCronEndpoint()
