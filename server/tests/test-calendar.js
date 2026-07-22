const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const icsGenerator = require('../services/calendar/icsGenerator');
const Meeting = require('../models/Meeting');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('============ STARTING CALENDAR TESTS ============');
  let passed = 0;
  let total = 0;

  function assert(condition, msg) {
    total++;
    if (condition) { passed++; console.log(`  ✓ Test ${total}: ${msg}`); }
    else { console.error(`  ❌ Test ${total} FAILED: ${msg}`); }
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');

    // --- Test 1: ICS generator with action items ---
    console.log('\n--- 1. ICS generation with action items ---');
    const mockMeeting = { _id: 'm1', title: 'Sprint Planning' };
    const actionItems = [
      { task: 'Complete API docs', owner: 'Alice', deadline: '2026-08-15', priority: 'High', status: 'Pending' },
      { task: 'Review PR', owner: 'Bob', deadline: '2026-08-20', priority: 'Medium', status: 'Pending' },
    ];

    const ics = icsGenerator.generateActionItemsIcs(mockMeeting, actionItems);
    assert(ics !== null, 'ICS content generated');
    assert(ics.includes('BEGIN:VCALENDAR'), 'Starts with VCALENDAR');
    assert(ics.includes('END:VCALENDAR'), 'Ends with VCALENDAR');
    assert(ics.includes('BEGIN:VEVENT'), 'Contains VEVENT');
    assert(ics.includes('Complete API docs'), 'Contains task text');
    assert(ics.includes('Alice'), 'Contains owner');
    assert(ics.includes('VERSION:2.0'), 'Has version 2.0');

    // --- Test 2: ICS with no action items ---
    console.log('\n--- 2. ICS with no action items ---');
    const emptyIcs = icsGenerator.generateActionItemsIcs(mockMeeting, []);
    assert(emptyIcs === null, 'No ICS for empty action items');

    // --- Test 3: ICS with null action items ---
    console.log('\n--- 3. ICS with null action items ---');
    const nullIcs = icsGenerator.generateActionItemsIcs(mockMeeting, null);
    assert(nullIcs === null, 'No ICS for null action items');

    // --- Test 4: Deadline parsing ---
    console.log('\n--- 4. Deadline parsing ---');
    const dateOnly = icsGenerator._parseDeadline('2026-08-15');
    assert(dateOnly !== null, 'Date-only deadline parsed');
    assert(dateOnly[2] === false, 'Date-only has no time');
    assert(dateOnly[0] === '2026-08-15', 'Date-only start is correct');

    const dateTime = icsGenerator._parseDeadline('2026-08-15T14:00:00Z');
    assert(dateTime !== null, 'DateTime deadline parsed');

    const nullDeadline = icsGenerator._parseDeadline(null);
    assert(nullDeadline === null, 'Null deadline returns null');

    const emptyDeadline = icsGenerator._parseDeadline('');
    assert(emptyDeadline === null, 'Empty deadline returns null');

    // --- Test 5: Format dates ---
    console.log('\n--- 5. Date formatting ---');
    const d = new Date('2026-08-15T12:00:00Z');
    const formatted = icsGenerator._formatDate(d);
    assert(typeof formatted === 'string' && formatted.length > 0, 'Date formatted as string');

    // --- Test 6: Calendar route test with real meeting ---
    console.log('\n--- 6. Real meeting ICS export ---');
    const realMeeting = await Meeting.findOne({ status: 'completed' });
    if (realMeeting) {
      const realActionItems = realMeeting.aiAnalysis?.actionItems || [];
      if (realActionItems.length > 0) {
        const realIcs = icsGenerator.generateActionItemsIcs(
          { _id: realMeeting._id.toString(), title: realMeeting.title },
          realActionItems
        );
        assert(realIcs !== null, 'Real meeting ICS generated');
        assert(realIcs.includes(realActionItems[0].task), 'Contains first action item');
      } else {
        console.log('  ⚠️ Real meeting has no action items, skipping ICS content check');
      }
    } else {
      console.log('  ⚠️ No completed meetings found, skipping real meeting test');
    }

    console.log(`\n============================================================`);
    console.log(`🎉 ${passed}/${total} CALENDAR TESTS PASSED!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
