const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Notification = require('../models/Notification');
const Meeting = require('../models/Meeting');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('============ STARTING NOTIFICATION TESTS ============');
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

    // --- Test 1: Create notification ---
    console.log('\n--- 1. Create notification ---');
    const notificationService = require('../services/notificationService');
    const userId = new mongoose.Types.ObjectId();
    const meetingId = new mongoose.Types.ObjectId();

    const notif = await notificationService.createNotification({
      userId,
      type: 'action_item_due',
      title: 'Test Notification',
      message: 'This is a test notification',
      meetingId,
      actionItemIndex: 0,
    });

    assert(notif._id, 'Notification created with _id');
    assert(notif.type === 'action_item_due', 'Type is action_item_due');
    assert(notif.read === false, 'New notification is unread');

    // --- Test 2: Deduplication ---
    console.log('\n--- 2. Notification deduplication ---');
    const duplicate = await notificationService.createNotification({
      userId,
      type: 'action_item_due',
      title: 'Test Notification',
      message: 'This is a test notification',
      meetingId,
      actionItemIndex: 0,
    });
    assert(duplicate._id.toString() === notif._id.toString(), 'Duplicate returns existing notification');

    // --- Test 3: Get notifications ---
    console.log('\n--- 3. Get notifications ---');
    const notifications = await notificationService.getNotifications(userId);
    assert(notifications.length >= 1, 'Notifications retrieved');
    assert(notifications[0].userId.toString() === userId.toString(), 'Belongs to correct user');

    // --- Test 4: Unread only filter ---
    console.log('\n--- 4. Unread filter ---');
    const unread = await notificationService.getNotifications(userId, { unreadOnly: true });
    for (const n of unread) {
      assert(n.read === false, `Notification ${n._id} is unread`);
    }

    // --- Test 5: Mark as read ---
    console.log('\n--- 5. Mark as read ---');
    const marked = await notificationService.markAsRead(notif._id, userId);
    assert(marked !== null, 'Notification marked as read');
    assert(marked.read === true, 'Read flag is true');

    // --- Test 6: Mark all as read ---
    console.log('\n--- 6. Mark all as read ---');
    const notif2 = await notificationService.createNotification({
      userId,
      type: 'info',
      title: 'Another Notification',
      message: 'Test 2',
    });
    await notificationService.markAllAsRead(userId);
    const allNotifs = await notificationService.getNotifications(userId, { unreadOnly: true });
    assert(allNotifs.length === 0, 'All notifications marked as read');

    // --- Test 7: Deadline parsing ---
    console.log('\n--- 7. Deadline parsing ---');
    const parsedDate = notificationService._parseDeadline('2026-08-15');
    assert(parsedDate instanceof Date, 'YYYY-MM-DD parsed as Date');
    assert(parsedDate.getFullYear() === 2026, 'Year matches');

    const parsedIso = notificationService._parseDeadline('2026-08-15T14:00:00.000Z');
    assert(parsedIso instanceof Date, 'ISO date parsed as Date');

    const parsedNull = notificationService._parseDeadline(null);
    assert(parsedNull === null, 'Null returns null');

    const parsedInvalid = notificationService._parseDeadline('not-a-date');
    assert(parsedInvalid === null, 'Invalid string returns null');

    // Cleanup
    await Notification.deleteMany({ userId });

    console.log(`\n============================================================`);
    console.log(`🎉 ${passed}/${total} NOTIFICATION TESTS PASSED!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
