#!/usr/bin/env tsx

import { DatabaseUtils } from '../src/lib/database'

async function testDatabase() {
  console.log('🧪 Testing Fantasy Football Database Setup\n')

  try {
    // Test 1: Check connection
    console.log('1. Testing database connection...')
    const connected = await DatabaseUtils.checkConnection()
    if (connected) {
      console.log('✅ Database connection successful')
    } else {
      console.log('❌ Database connection failed')
      return
    }

    // Test 2: Check table counts (should start empty)
    console.log('\n2. Checking initial table state...')
    const initialCounts = await DatabaseUtils.getTableCounts()
    console.log('📊 Table counts:')
    Object.entries(initialCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`)
    })

    // Test 3: Create test admin user
    console.log('\n3. Creating test admin user...')
    const adminUser = await DatabaseUtils.createTestUser({
      clerkId: 'test_admin_clerk_id',
      email: 'admin@test.com',
      firstName: 'Test',
      lastName: 'Admin',
      isAdmin: true
    })
    console.log('✅ Admin user created:', adminUser.email)

    // Test 4: Create test manager user
    console.log('\n4. Creating test manager user...')
    const managerUser = await DatabaseUtils.createTestUser({
      clerkId: 'test_manager_clerk_id',
      email: 'manager@test.com',
      firstName: 'Test',
      lastName: 'Manager',
      isAdmin: false
    })
    console.log('✅ Manager user created:', managerUser.email)

    // Test 5: Create test league
    console.log('\n5. Creating test league...')
    const testLeague = await DatabaseUtils.createTestLeague({
      name: 'Test Fantasy League',
      adminId: adminUser.id,
      season: '2024-25'
    })
    console.log('✅ League created:', testLeague.name)

    // Test 6: Seed test players
    console.log('\n6. Seeding test players...')
    const players = await DatabaseUtils.seedTestPlayers(16)
    console.log(`✅ Created ${players.length} test players`)

    // Test 7: Check final table counts
    console.log('\n7. Checking final table state...')
    const finalCounts = await DatabaseUtils.getTableCounts()
    console.log('📊 Final table counts:')
    Object.entries(finalCounts).forEach(([table, count]) => {
      const change = count - (initialCounts[table] || 0)
      const changeStr = change > 0 ? ` (+${change})` : ''
      console.log(`   ${table}: ${count}${changeStr}`)
    })

    console.log('\n🎉 Database test completed successfully!')

    // Optional: Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await DatabaseUtils.clearTestData()
    console.log('✅ Test data cleaned up')

  } catch (error) {
    console.error('❌ Database test failed:', error)
    process.exit(1)
  }
}

// Run the test
testDatabase()