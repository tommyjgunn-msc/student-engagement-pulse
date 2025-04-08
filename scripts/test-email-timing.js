// scripts/test-email-timing.js
require('dotenv').config();

const { matchesDay, classJustEnded, parseSchedule } = require('../lib/schedule');
const { isTeachingDay, getAcademicContext } = require('../lib/academicCalendar');

// Create some test cases
const testCases = [
  {
    name: "Current day class that should trigger",
    schedule: `${getCurrentDayName()}, ${getCurrentHourMinusTwo()}`,
    expectMatch: true
  },
  {
    name: "Current day class too early to trigger",
    schedule: `${getCurrentDayName()}, ${getCurrentHourPlusOne()}`,
    expectMatch: false
  },
  {
    name: "Different day class",
    schedule: "Saturday, 14:30",
    expectMatch: false
  }
];

// Helper function to get current day name
function getCurrentDayName() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

// Helper to get current hour minus 2 (for a class that ended 5 min ago)
function getCurrentHourMinusTwo() {
  const now = new Date();
  now.setHours(now.getHours() - 2);
  now.setMinutes(now.getMinutes() - 5);
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Helper to get current hour plus 1 (for a class that hasn't ended)
function getCurrentHourPlusOne() {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Run the tests
async function runTests() {
  console.log("=== Testing Schedule Functions ===");
  
  // Test parseSchedule
  console.log("\nTesting parseSchedule:");
  const schedule = parseSchedule("Monday, 14:30");
  console.log(schedule);
  
  // Test matchesDay
  console.log("\nTesting matchesDay:");
  const today = new Date().getDay();
  console.log(`Today is day ${today}`);
  console.log(`Matches "Monday": ${matchesDay("Monday, 14:30", today)}`);
  console.log(`Matches "Tuesday": ${matchesDay("Tuesday, 14:30", today)}`);
  
  // Test classJustEnded with our test cases
  console.log("\nTesting classJustEnded with test cases:");
  for (const testCase of testCases) {
    const result = classJustEnded(testCase.schedule);
    console.log(`${testCase.name}: ${result === testCase.expectMatch ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Schedule: ${testCase.schedule}, Result: ${result}, Expected: ${testCase.expectMatch}`);
  }
  
  // Test academic calendar functions
  console.log("\n=== Testing Academic Calendar Functions ===");
  const now = new Date();
  
  console.log("\nTesting isTeachingDay:");
  const teachingDay = await isTeachingDay(now);
  console.log(`Is today (${now.toDateString()}) a teaching day? ${teachingDay}`);
  
  console.log("\nTesting getAcademicContext:");
  const context = await getAcademicContext(now);
  console.log(context);
}

runTests().catch(console.error);