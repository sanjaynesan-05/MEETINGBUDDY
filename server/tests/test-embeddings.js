const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Meeting = require('../models/Meeting');
const MeetingChunk = require('../models/MeetingChunk');
const chunkingService = require('../services/embeddings/chunking.service');
const embeddingProviderFactory = require('../services/embeddings/embedding.factory');
const embeddingStorage = require('../services/embeddings/embedding.storage');
const embeddingService = require('../services/embeddings/embedding.service');
const { computeContentHash, generateChunkId, estimateTokens } = require('../services/embeddings/embedding.helpers');

// Setup in-memory / mock or real MongoDB connection for tests
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_intelligence';

async function runTests() {
  console.log('============ STARTING EMBEDDING GENERATION INFRASTRUCTURE TESTS ============');
  let testCount = 0;
  let passedCount = 0;

  function assert(condition, message) {
    testCount++;
    if (condition) {
      console.log(`  ✓ Test ${testCount}: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ Test ${testCount} FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Connect to DB
    await mongoose.connect(mongoUri);
    console.log('🔌 Connected to MongoDB for verification');

    // Create a mock meeting document
    const mockMeeting = await Meeting.create({
      title: 'Test Embedding Meeting',
      originalFileName: 'test.mp3',
      storedFileName: `test_${Date.now()}.mp3`,
      filePath: '/tmp/test.mp3',
      fileType: 'audio',
      mimeType: 'audio/mp3',
      fileSize: 1024,
      uploadedBy: new mongoose.Types.ObjectId(),
    });
    const meetingId = mockMeeting._id.toString();

    // Clean up any stale chunks for this meeting
    await embeddingStorage.deleteChunksForMeeting(meetingId);

    // -------------------------------------------------------------
    // Test 1: Helper Functions (Token Estimation & Content Hashing)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Helper Utilities ---');
    const textSample = 'Hello world, this is a test transcript sentence.';
    const hash = computeContentHash(textSample);
    const tokens = estimateTokens(textSample);
    assert(hash.length === 64, 'computeContentHash returns 64-character hex string');
    assert(tokens === Math.ceil(textSample.length / 4), 'estimateTokens calculates char / 4');

    // -------------------------------------------------------------
    // Test 2: Chunking Service (Empty, Small, Large, Boundaries)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Chunking Service ---');
    const emptyChunks = chunkingService.chunkTranscript(meetingId, '');
    assert(emptyChunks.length === 0, 'Empty transcript yields 0 chunks');

    const smallText = 'Welcome to the project kick-off meeting.';
    const smallChunks = chunkingService.chunkTranscript(meetingId, smallText);
    assert(smallChunks.length === 1, 'Small transcript yields 1 chunk');
    assert(smallChunks[0].chunkType === 'Transcript', 'Default chunkType is Transcript');
    assert(smallChunks[0].contentHash === computeContentHash(smallText), 'Content hash matches');

    const paragraph1 = 'First sentence of the first paragraph. Second sentence here.';
    const paragraph2 = 'First sentence of the second paragraph. Another line follows.';
    const largeText = `${paragraph1}\n\n${paragraph2}`;
    const largeChunks = chunkingService.chunkTranscript(meetingId, largeText);
    assert(largeChunks.length >= 1, 'Large transcript chunked cleanly');

    // -------------------------------------------------------------
    // Test 3: Provider Factory Abstraction
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Provider Factory ---');
    const mockProvider = embeddingProviderFactory.getProvider('mock', { dimensions: 768 });
    assert(mockProvider.name === 'mock', 'Factory returns MockEmbeddingProvider');
    
    const mockVectors = await mockProvider.generateEmbeddings(['Test text 1', 'Test text 2']);
    assert(mockVectors.length === 2, 'Mock provider returns 2 vectors');
    assert(mockVectors[0].vector.length === 768, 'Vector dimensions match 768');

    const ollamaProvider = embeddingProviderFactory.getProvider('ollama');
    assert(ollamaProvider.name === 'ollama', 'Factory returns OllamaEmbeddingProvider');

    // -------------------------------------------------------------
    // Test 4: Core Embedding Pipeline Execution (Storage & DB Check)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Full Pipeline Execution ---');
    const resultStats1 = await embeddingService.processMeetingEmbeddings(meetingId, largeText, {
      provider: 'mock',
    });
    assert(resultStats1.chunksCreated > 0, 'Chunks created > 0');
    assert(resultStats1.embeddingsGenerated === resultStats1.chunksCreated, 'All chunks generated embeddings');
    assert(resultStats1.chunksSkipped === 0, 'Initial run skips 0 chunks');

    // Verify DB records
    const storedDocs = await MeetingChunk.find({ meetingId });
    assert(storedDocs.length === resultStats1.chunksCreated, 'MeetingChunk documents saved in MongoDB');
    assert(storedDocs[0].embedding.provider === 'mock', 'Stored embedding metadata retains provider name');
    assert(storedDocs[0].embedding.dimensions === 768, 'Stored embedding metadata retains vector dimensions');

    const updatedMeeting = await Meeting.findById(meetingId);
    assert(updatedMeeting.embeddingStatus === 'completed', 'Meeting embeddingStatus updated to completed');

    // -------------------------------------------------------------
    // Test 5: Incremental Processing & Idempotency (Skip Existing)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Incremental Processing & Idempotency ---');
    const resultStats2 = await embeddingService.processMeetingEmbeddings(meetingId, largeText, {
      provider: 'mock',
    });
    assert(resultStats2.chunksSkipped === resultStats2.chunksCreated, 'Duplicate run skips 100% of identical chunks');
    assert(resultStats2.embeddingsGenerated === 0, 'Zero new embeddings generated on identical rerun');

    // -------------------------------------------------------------
    // Test 6: Selective Regeneration on Content Modification
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Selective Regeneration on Text Update ---');
    const modifiedText = `${largeText} Additional appended sentence for modification test.`;
    const resultStats3 = await embeddingService.processMeetingEmbeddings(meetingId, modifiedText, {
      provider: 'mock',
    });
    assert(resultStats3.embeddingsGenerated > 0, 'Modified content triggered new embedding generation');

    // -------------------------------------------------------------
    // Clean up Test Data
    // -------------------------------------------------------------
    console.log('\n--- Cleanup ---');
    await embeddingStorage.deleteChunksForMeeting(meetingId);
    await Meeting.findByIdAndDelete(meetingId);
    console.log('🧹 Cleaned up test database records');

    console.log(`\n============================================================`);
    console.log(`🎉 ALL ${passedCount}/${testCount} EMBEDDING INFRASTRUCTURE TESTS PASSED!`);
    console.log(`============================================================\n`);
  } catch (error) {
    console.error('\n❌ TEST RUNNER FAILED WITH EXCEPTION:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

runTests();
