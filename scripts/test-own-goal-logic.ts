/**
 * Test script to verify own goal calculation logic
 */

import { calculateMatchScore, calculateLineupTotalGoals } from '../src/utils/own-goal-calculator'

console.log('=== Testing Own Goal Calculator ===\n')

// Test Case 1: Home team scores 2, Away team scores 1 (no own goals)
console.log('Test 1: Normal goals - Home 2, Away 1')
const test1Results = new Map([
  ['home_player_1', 1],  // 1 goal
  ['home_player_2', 1],  // 1 goal
  ['home_player_3', 0],  // no goals
  ['away_player_1', 1],  // 1 goal
  ['away_player_2', 0],  // no goals
  ['away_player_3', 0],  // no goals
])
const test1 = calculateMatchScore(
  ['home_player_1', 'home_player_2', 'home_player_3'],
  ['away_player_1', 'away_player_2', 'away_player_3'],
  test1Results
)
console.log(`Expected: Home 2, Away 1`)
console.log(`Actual: Home ${test1.homeScore}, Away ${test1.awayScore}`)
console.log(`✓ ${test1.homeScore === 2 && test1.awayScore === 1 ? 'PASS' : 'FAIL'}\n`)

// Test Case 2: Woltemade scenario - Home team 2 goals, Away team has 1 player with own goal
console.log('Test 2: Woltemade scenario - Own goal by away player')
console.log('Home team: 2 goals scored')
console.log('Away team: 1 own goal (should count FOR home team)')
const test2Results = new Map([
  ['home_player_1', 1],  // 1 goal
  ['home_player_2', 1],  // 1 goal
  ['home_player_3', 0],  // no goals
  ['away_player_1', -1], // OWN GOAL (Woltemade)
  ['away_player_2', 0],  // no goals
  ['away_player_3', 0],  // no goals
])
const test2 = calculateMatchScore(
  ['home_player_1', 'home_player_2', 'home_player_3'],
  ['away_player_1', 'away_player_2', 'away_player_3'],
  test2Results
)
console.log(`Expected: Home 3 (2 regular + 1 own goal), Away 0`)
console.log(`Actual: Home ${test2.homeScore}, Away ${test2.awayScore}`)
console.log(`✓ ${test2.homeScore === 3 && test2.awayScore === 0 ? 'PASS' : 'FAIL'}\n`)

// Test Case 3: Total goals for lineup (excluding own goals)
console.log('Test 3: Lineup total goals (excluding own goals)')
console.log('Players: 1 goal, 2 goals, -1 own goal')
const test3Results = new Map([
  ['player_1', 1],  // 1 goal
  ['player_2', 2],  // 2 goals
  ['player_3', -1], // OWN GOAL - should NOT count
])
const test3 = calculateLineupTotalGoals(
  ['player_1', 'player_2', 'player_3'],
  test3Results
)
console.log(`Expected: 3 (only counting regular goals, not own goal)`)
console.log(`Actual: ${test3}`)
console.log(`✓ ${test3 === 3 ? 'PASS' : 'FAIL'}\n`)

// Test Case 4: Both teams score own goals
console.log('Test 4: Both teams have own goals')
console.log('Home: 1 regular goal, 1 own goal')
console.log('Away: 2 regular goals, 1 own goal')
const test4Results = new Map([
  ['home_player_1', 1],  // 1 goal
  ['home_player_2', -1], // own goal (counts for AWAY)
  ['home_player_3', 0],  // no goals
  ['away_player_1', 2],  // 2 goals
  ['away_player_2', -1], // own goal (counts for HOME)
  ['away_player_3', 0],  // no goals
])
const test4 = calculateMatchScore(
  ['home_player_1', 'home_player_2', 'home_player_3'],
  ['away_player_1', 'away_player_2', 'away_player_3'],
  test4Results
)
console.log(`Expected: Home 2 (1 regular + 1 from away OG), Away 3 (2 regular + 1 from home OG)`)
console.log(`Actual: Home ${test4.homeScore}, Away ${test4.awayScore}`)
console.log(`✓ ${test4.homeScore === 2 && test4.awayScore === 3 ? 'PASS' : 'FAIL'}\n`)

console.log('=== All Tests Complete ===')
