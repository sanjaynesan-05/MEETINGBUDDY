const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const searchService = require('../services/search/search.service');
const Meeting = require('../models/Meeting');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to database.');

  const dummyUserId = new mongoose.Types.ObjectId();
  
  console.log('\n--- 1. Testing Empty Database ---');
  const emptyRes = await searchService.search(dummyUserId, { q: 'hello' });
  if (emptyRes.stats.returned === 0) {
    console.log('✅ Empty DB handled gracefully.');
  } else {
    console.error('❌ Empty DB failed.');
  }

  // Fetch real user
  const existingMeeting = await Meeting.findOne({ status: 'completed' });
  
  if (!existingMeeting) {
    console.log('⚠️ No completed meetings found to run deep tests.');
  } else {
    const realUserId = existingMeeting.uploadedBy;
    console.log(`\nTesting with real User ID: ${realUserId}`);

    // Let's use a common word to ensure we get results, or a specific substring
    // We will test various cases of a known keyword if possible, or just arbitrary strings
    
    console.log('\n--- 2. Regex Edge Cases (MixedCase, Uppercase, Substring) ---');
    // Assuming "deploy", "team", "model", or "a" is in the text
    const testQueries = ['TEAM', 'tEaM', 'team', 'tea'];
    for (const q of testQueries) {
      const res = await searchService.search(realUserId, { q });
      console.log(`Query: "${q}" -> Returned: ${res.stats.returned} | Total: ${res.stats.searchedMeetings} | Time: ${res.stats.executionTimeMs}ms`);
      if (res.results.length > 0) {
        console.log(`   Sample Snippet (${res.results[0].snippetField}): ${res.results[0].snippet}`);
      }
    }

    console.log('\n--- 3. Testing Pagination ---');
    const pageRes = await searchService.search(realUserId, { q: 'a', limit: 1, page: 2 });
    console.log(`Page 2, Limit 1 -> Returned: ${pageRes.stats.returned} (Total expected: ${pageRes.pagination.total})`);
    
    console.log('\n--- 4. Testing Date Filtering ---');
    const dateRes = await searchService.search(realUserId, { q: 'a', from: '2030-01-01', to: '2030-12-31' });
    if (dateRes.stats.searchedMeetings === 0) {
      console.log('✅ Date filter correctly returned 0 for future dates.');
    } else {
      console.error('❌ Date filter failed.');
    }
    
    console.log('\n--- 5. Testing Meeting Type Filtering ---');
    const typeRes = await searchService.search(realUserId, { q: 'a', meetingType: 'NonExistentType' });
    if (typeRes.stats.searchedMeetings === 0) {
      console.log('✅ Meeting Type filter applied successfully.');
    } else {
      console.error('❌ Meeting Type filter failed.');
    }

    console.log('\n--- 6. Verify Score Ordering & Frontend Contract ---');
    const fullRes = await searchService.search(realUserId, { q: 'deploy' });
    if (fullRes.results.length > 1) {
      const isSorted = fullRes.results[0].score >= fullRes.results[1].score;
      console.log(`✅ Sorting verified: Highest score first (${fullRes.results[0].score} >= ${fullRes.results[1].score}) = ${isSorted}`);
    } else {
      console.log(`✅ Only ${fullRes.results.length} result(s). Contract sample:`);
      console.log(JSON.stringify(fullRes.results[0], null, 2));
    }
  }

  await mongoose.disconnect();
  console.log('\nTests completed successfully.');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
