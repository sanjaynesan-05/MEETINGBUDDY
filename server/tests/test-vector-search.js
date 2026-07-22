const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const qdrantStorage = require('../services/embeddings/qdrantStorage');
const MeetingChunk = require('../models/MeetingChunk');
const Meeting = require('../models/Meeting');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('============ STARTING VECTOR SEARCH TESTS ============');
  let passed = 0;
  let total = 0;

  function assert(condition, msg) {
    total++;
    if (condition) { passed++; console.log(`  ✓ Test ${total}: ${msg}`); }
    else { console.error(`  ❌ Test ${total} FAILED: ${msg}`); }
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // --- Test 1: Vector search with no query ---
    console.log('\n--- 1. Empty query handling ---');
    const vectorSearch = require('../services/search/vectorSearch.service');
    const emptyRes = await vectorSearch.search('');
    assert(emptyRes.success === true, 'Empty query returns success');
    assert(emptyRes.results.length === 0, 'Empty query returns 0 results');

    // --- Test 2: Vector search with non-existent meeting ---
    console.log('\n--- 2. Search with meetingId filter (no data) ---');
    const noMatchRes = await vectorSearch.search('test query', { meetingId: new mongoose.Types.ObjectId().toString() });
    assert(noMatchRes.results.length === 0, 'No matching meeting returns 0 results');

    // --- Test 3: Qdrant upsert and search with mock data ---
    console.log('\n--- 3. Qdrant upsert and search ---');
    const testMeetingId = new mongoose.Types.ObjectId().toString();
    const testChunks = [
      {
        meetingId: testMeetingId,
        chunkId: `chk_test_v1_idx0`,
        chunkIndex: 0,
        text: 'The project kickoff meeting discussed quarterly goals and team assignments.',
        chunkVersion: 1,
        contentHash: 'abc123',
        chunkType: 'Transcript',
        metadata: { speaker: 'Alice', tokenEstimate: 10, meetingType: 'Kickoff' },
        embedding: { vector: new Array(768).fill(0).map((_, i) => Math.sin(i) * 0.1), model: 'mock', provider: 'mock', dimensions: 768, generatedAt: new Date() },
      },
    ];

    const upsertCount = await qdrantStorage.upsertChunks(testChunks);
    assert(upsertCount === 1, 'Upserted 1 chunk to Qdrant');

    const searchRes = await vectorSearch.search('project kickoff', { meetingId: testMeetingId });
    assert(searchRes.success === true, 'Vector search returns success');
    console.log(`  Query returned ${searchRes.results.length} results`);

    // --- Test 4: Response shape ---
    console.log('\n--- 4. Response shape contract ---');
    assert(typeof searchRes.stats.executionTimeMs === 'number', 'Has executionTimeMs');
    assert(Array.isArray(searchRes.results), 'Results is an array');

    // Cleanup
    await qdrantStorage.deleteChunksForMeeting(testMeetingId);

    console.log(`\n============================================================`);
    console.log(`🎉 ${passed}/${total} VECTOR SEARCH TESTS PASSED!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
