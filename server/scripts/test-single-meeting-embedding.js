const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Meeting = require('../models/Meeting');
const MeetingChunk = require('../models/MeetingChunk');
const embeddingService = require('../services/embeddings/embedding.service');
const qdrantStorage = require('../services/embeddings/qdrantStorage');

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/meeting_intelligence';

async function testSingleMeeting() {
  let meeting;

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Select ONE completed meeting with a transcript.
    meeting = await Meeting.findOne({
      status: 'completed',
      transcript: { $exists: true, $ne: '' }
    }).sort({ createdAt: -1 });

    if (!meeting) {
      throw new Error(
        'No completed meeting with transcript was found.'
      );
    }

    const meetingId = meeting._id.toString();

    console.log('\n========================================');
    console.log('SELECTED MEETING');
    console.log('========================================');
    console.log('Title:', meeting.title);
    console.log('Meeting ID:', meetingId);
    console.log('Transcript length:', meeting.transcript.length);

    console.log('\n========================================');
    console.log('PROCESSING EMBEDDINGS');
    console.log('========================================');

    const result =
      await embeddingService.processMeetingEmbeddings(
        meetingId,
        meeting.transcript
      );

    console.log('\nEmbedding service result:');
    console.log(result);

    // -----------------------------------------
    // MongoDB verification
    // -----------------------------------------

    const mongoChunks = await MeetingChunk.find({
      meetingId: meeting._id
    })
      .sort({ chunkIndex: 1 })
      .lean();

    console.log('\n========================================');
    console.log('MONGODB VERIFICATION');
    console.log('========================================');

    console.log('MongoDB chunks:', mongoChunks.length);

    if (mongoChunks.length === 0) {
      throw new Error(
        'No MeetingChunk documents found in MongoDB.'
      );
    }

    const firstChunk = mongoChunks[0];

    console.log('First chunk ID:', firstChunk.chunkId);
    console.log('First chunk index:', firstChunk.chunkIndex);
    console.log(
      'Embedding dimensions:',
      firstChunk.embedding?.dimensions ||
        firstChunk.embedding?.vector?.length ||
        0
    );

    // -----------------------------------------
    // Qdrant verification
    // -----------------------------------------

    console.log('\n========================================');
    console.log('QDRANT VERIFICATION');
    console.log('========================================');

    const vector = firstChunk.embedding?.vector;

    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error(
        'First MongoDB chunk does not contain an embedding vector.'
      );
    }

    const filter = {
      must: [
        {
          key: 'meetingId',
          match: {
            value: meetingId
          }
        }
      ]
    };

    const qdrantResults =
      await qdrantStorage.searchPoints(
        vector,
        filter,
        5
      );

    if (qdrantResults === null) {
      throw new Error(
        'Qdrant search returned null.'
      );
    }

    console.log(
      'Qdrant matching results:',
      qdrantResults.length
    );

    if (qdrantResults.length > 0) {
      const firstResult = qdrantResults[0];

      console.log('\nTop Qdrant result:');
      console.log('Point ID:', firstResult.id);
      console.log('Score:', firstResult.score);
      console.log(
        'Meeting ID:',
        firstResult.payload?.meetingId
      );
      console.log(
        'Chunk ID:',
        firstResult.payload?.chunkId
      );
      console.log(
        'Text:',
        firstResult.payload?.text?.substring(0, 150)
      );
    }

    // -----------------------------------------
    // Final validation
    // -----------------------------------------

    console.log('\n========================================');
    console.log('FINAL VALIDATION');
    console.log('========================================');

    const mongoChunkId = firstChunk.chunkId;

    const matchingQdrantResult =
      qdrantResults.find(
        result =>
          result.payload?.chunkId === mongoChunkId
      );

    if (!matchingQdrantResult) {
      throw new Error(
        'MongoDB chunk was not found in Qdrant.'
      );
    }

    console.log('MongoDB → Qdrant mapping: PASS');
    console.log('Embedding generation: PASS');
    console.log('MongoDB storage: PASS');
    console.log('Qdrant indexing: PASS');
    console.log('Vector similarity search: PASS');

    console.log('\n========================================');
    console.log('END-TO-END TEST PASSED');
    console.log('========================================');

  } catch (error) {
    console.error('\n========================================');
    console.error('TEST FAILED');
    console.error('========================================');
    console.error(error);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testSingleMeeting();