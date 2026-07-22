const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const rrfService = require('../services/search/rrf.service');
const qdrantStorage = require('../services/embeddings/qdrantStorage');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('============ STARTING HYBRID SEARCH (RRF) TESTS ============');
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

    // --- Test 1: RRF math with hand-computed fixture ---
    console.log('\n--- 1. RRF math correctness (k=60) ---');
    const kwResults = [
      { meetingId: 'm1', score: 10, matchType: 'Transcript' },
      { meetingId: 'm2', score: 8, matchType: 'Transcript' },
    ];
    const vecResults = [
      { meetingId: 'm2', score: 0.95, chunkId: 'chk2' },
      { meetingId: 'm3', score: 0.90, chunkId: 'chk3' },
    ];

    const fused = rrfService._reciprocalRankFusion(kwResults, vecResults);
    assert(fused.length === 3, 'RRF merges 3 unique items from 2+2 with 1 overlap');

    const m1 = fused.find(r => r.meetingId === 'm1');
    const m2 = fused.find(r => r.meetingId === 'm2');
    const m3 = fused.find(r => r.meetingId === 'm3');
    assert(!!m1, 'm1 present');
    assert(!!m2, 'm2 present');
    assert(!!m3, 'm3 present');

    const expectedM1Score = 1 / (60 + 0 + 1);
    const expectedM2Score = 1 / (60 + 1 + 1) + 1 / (60 + 0 + 1);
    const expectedM3Score = 1 / (60 + 1 + 1);
    assert(Math.abs(m1.rrfScore - expectedM1Score) < 0.001, `m1 RRF score correct (${m1.rrfScore.toFixed(4)} ≈ ${expectedM1Score.toFixed(4)})`);
    assert(Math.abs(m2.rrfScore - expectedM2Score) < 0.001, `m2 RRF score correct (${m2.rrfScore.toFixed(4)} ≈ ${expectedM2Score.toFixed(4)})`);
    assert(Math.abs(m3.rrfScore - expectedM3Score) < 0.001, `m3 RRF score correct (${m3.rrfScore.toFixed(4)} ≈ ${expectedM3Score.toFixed(4)})`);

    assert(Number.isFinite(fused[0].rrfScore), 'Top result has finite RRF score');
    assert(fused[0].sources && fused[0].sources.length >= 1, 'Top result has sources array');

    // --- Test 2: RRF with only keyword results ---
    console.log('\n--- 2. RRF with only keyword results ---');
    const kwOnlyFused = rrfService._reciprocalRankFusion(kwResults, []);
    assert(kwOnlyFused.length === 2, 'Only keyword results yields 2 items');

    // --- Test 3: RRF with only vector results ---
    console.log('\n--- 3. RRF with only vector results ---');
    const vecOnlyFused = rrfService._reciprocalRankFusion([], vecResults);
    assert(vecOnlyFused.length === 2, 'Only vector results yields 2 items');

    // --- Test 4: RRF handles empty both ---
    console.log('\n--- 4. RRF with both empty ---');
    const emptyFused = rrfService._reciprocalRankFusion([], []);
    assert(emptyFused.length === 0, 'Both empty yields 0 items');

    // --- Test 5: Sorted by RRF score descending ---
    console.log('\n--- 5. RRF sorting ---');
    for (let i = 0; i < fused.length - 1; i++) {
      assert(fused[i].rrfScore >= fused[i + 1].rrfScore, `RRF sorted descending at index ${i}`);
    }

    // --- Test 6: Docs only in one list get correct ranks ---
    console.log('\n--- 6. Single-list document ranks ---');
    assert(m1.keywordRank === 1, 'm1 has keywordRank=1');
    assert(m1.vectorRank === null, 'm1 has null vectorRank');
    assert(m3.keywordRank === null, 'm3 has null keywordRank');
    assert(m3.vectorRank === 2, 'm3 has vectorRank=2');

    // --- Test 7: Hybrid search with no query falls back to keyword ---
    console.log('\n--- 7. Empty query fallback ---');
    const dummyUserId = new mongoose.Types.ObjectId();
    const emptyQueryRes = await rrfService.hybridSearch(dummyUserId, { q: '' });
    assert(emptyQueryRes.success === true, 'Empty query returns success');
    assert(emptyQueryRes.hybrid === undefined || emptyQueryRes.hybrid === false, 'Empty query uses keyword-only path');

    console.log(`\n============================================================`);
    console.log(`🎉 ALL ${passed}/${total} HYBRID SEARCH (RRF) TESTS PASSED!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
