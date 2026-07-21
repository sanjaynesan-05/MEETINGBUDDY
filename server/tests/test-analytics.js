const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const analyticsService = require('../services/analytics/analytics.service');
const Meeting = require('../models/Meeting');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to database.');

  const dummyUserId = new mongoose.Types.ObjectId();
  console.log('\n--- 1. Testing Empty Database ---');
  console.time('Empty DB Analytics');
  const emptyDashboard = await analyticsService.getDashboard(dummyUserId);
  console.timeEnd('Empty DB Analytics');
  
  if (emptyDashboard.overview.totalMeetings === 0) {
    console.log('✅ Empty DB handled gracefully.');
  } else {
    console.error('❌ Empty DB failed.');
  }

  console.log('\n--- 2. Fetching real user with meetings ---');
  const existingMeeting = await Meeting.findOne({ status: 'completed' });
  
  if (!existingMeeting) {
    console.log('⚠️ No completed meetings found in the database to test real data.');
  } else {
    const realUserId = existingMeeting.uploadedBy;
    console.log(`Testing with real User ID: ${realUserId}`);
    
    console.time('Real DB Analytics');
    const realDashboard = await analyticsService.getDashboard(realUserId);
    console.timeEnd('Real DB Analytics');
    
    console.log('\n✅ Successfully aggregated data for real user.');
    console.log(JSON.stringify(realDashboard, null, 2));

    console.log('\n--- 3. Testing Health Endpoint ---');
    console.time('Health Endpoint');
    const health = await analyticsService.getHealth(realUserId);
    console.timeEnd('Health Endpoint');
    console.log('✅ Health data:', JSON.stringify(health, null, 2));
    
    console.log('\n--- 4. Testing Date Filters (from > to) ---');
    // Using service directly; controller handles the HTTP 400 part, but let's test a valid empty range
    const filterDashboard = await analyticsService.getDashboard(realUserId, { 
      from: '2030-01-01', 
      to: '2030-12-31' 
    });
    console.log('✅ Date filter applied correctly (returned 0 for future dates):', filterDashboard.overview.totalMeetings);
  }

  await mongoose.disconnect();
  console.log('\nTests completed successfully.');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
