const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ragRetrieval = require('../services/ai/ragRetrieval.service');
const ragChat = require('../services/ai/ragChat.service');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('============ STARTING RAG CHAT TESTS ============');
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

    // --- Test 1: Empty question handling ---
    console.log('\n--- 1. Empty question handling ---');
    const emptyRes = await ragChat.chat({ question: '', userId: new mongoose.Types.ObjectId().toString() });
    assert(emptyRes.success === true, 'Empty question returns success');
    assert(emptyRes.answer.includes('Please provide a question'), 'Empty question returns appropriate message');
    assert(emptyRes.citations.length === 0, 'Empty question has no citations');
    assert(emptyRes.metadata.chunksUsed === 0, 'Empty question used 0 chunks');

    // --- Test 2: Question length bounding ---
    console.log('\n--- 2. Question length bounding ---');
    const longQ = 'x'.repeat(2000);
    const boundedRes = await ragChat.chat({ question: longQ, userId: new mongoose.Types.ObjectId().toString() });
    assert(boundedRes.success === true, 'Long question is bounded gracefully');

    // --- Test 3: No-context graceful handling ---
    console.log('\n--- 3. No-context graceful handling ---');
    const noCtxRes = await ragChat.chat({ question: 'supercalifragilisticexpialidocious specific query', userId: new mongoose.Types.ObjectId().toString() });
    assert(noCtxRes.success === true, 'No-context returns success');
    assert(noCtxRes.metadata.chunksUsed === 0, 'No-context has 0 chunks');
    assert(noCtxRes.citations.length === 0, 'No-context has no citations');

    // --- Test 4: RagRetrieval with empty question ---
    console.log('\n--- 4. RagRetrieval edge cases ---');
    const emptyRetrieval = await ragRetrieval.retrieveForChat({ question: '', userId: new mongoose.Types.ObjectId().toString() });
    assert(emptyRetrieval.chunks.length === 0, 'Empty retrieval returns no chunks');
    assert(emptyRetrieval.totalChars === 0, 'Empty retrieval has 0 totalChars');

    // --- Test 5: RagRetrieval with meetingId (no existing data) ---
    console.log('\n--- 5. RagRetrieval with meeting filter ---');
    const meetingRetrieval = await ragRetrieval.retrieveForChat({
      question: 'project update',
      meetingId: new mongoose.Types.ObjectId().toString(),
      userId: new mongoose.Types.ObjectId().toString(),
    });
    assert(meetingRetrieval.chunks.length === 0, 'Non-existent meeting returns no chunks');

    // --- Test 6: Conversation history bounding ---
    console.log('\n--- 6. Conversation history bounding ---');
    const manyMessages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i + 1}`,
    }));
    const boundedHistory = ragChat._boundHistory(manyMessages);
    assert(boundedHistory.length <= 10, 'History bounded to max 10 messages');

    // --- Test 7: Citation parse regex ---
    console.log('\n--- 7. Citation parsing ---');
    const testAnswer = 'The project deadline is next week [S1] according to the meeting. The budget was approved [S2].';
    const parsed = ragChat._parseResponse(testAnswer);
    assert(parsed.citedLabels.includes('[S1]'), 'Parses [S1] citation');
    assert(parsed.citedLabels.includes('[S2]'), 'Parses [S2] citation');
    assert(parsed.answer === testAnswer, 'Answer preserved as-is');

    // --- Test 8: No citations in answer ---
    console.log('\n--- 8. No citations in answer ---');
    const noCiteAnswer = 'There is no information about that in the transcripts.';
    const parsedNoCite = ragChat._parseResponse(noCiteAnswer);
    assert(parsedNoCite.citedLabels.length === 0, 'No citations extracted from non-cited answer');

    // --- Test 9: Inject fallback citation when no citations found ---
    console.log('\n--- 9. Fallback citation injection ---');
    const fallbackResult = ragChat._injectFallbackCitations(
      'The meeting discussed quarterly targets.',
      [],
      [{ sourceLabel: '[S1]', meetingId: 'm1', snippet: 'quarterly targets' }]
    );
    assert(fallbackResult.includes('[S1]'), 'Fallback citation label injected');
    assert(fallbackResult.includes('m1'), 'Fallback meetingId injected');

    console.log(`\n============================================================`);
    console.log(`🎉 ALL ${passed}/${total} RAG CHAT TESTS PASSED!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
