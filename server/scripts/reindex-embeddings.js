/**
 * Rebuild transcript embeddings for every completed meeting and bring
 * MongoDB (meetingchunks) and Qdrant back in sync.
 *
 * Steps per meeting:
 *   1. Re-chunk using the stored transcript segments (same options as the
 *      upload pipeline in meetingController) and embed / upsert to Qdrant.
 *   2. Only after that succeeds, delete stale chunks from older chunk
 *      versions in MongoDB and stale points in Qdrant.
 *
 * Usage:  node scripts/reindex-embeddings.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

const Meeting = require('../models/Meeting');
const MeetingChunk = require('../models/MeetingChunk');
const embeddingService = require('../services/embeddings/embedding.service');
const { qdrantClient, COLLECTION_NAME, QDRANT_ENABLED } = require('../services/embeddings/qdrantStorage');
const { CURRENT_CHUNK_VERSION } = require('../services/embeddings/embedding.constants');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_intelligence';

async function removeStale(meetingId) {
  const current = await MeetingChunk.find({ meetingId, chunkVersion: CURRENT_CHUNK_VERSION })
    .select('chunkId')
    .lean();
  const keepIds = current.map((c) => c.chunkId);
  if (keepIds.length === 0) return { mongo: 0, qdrant: 'skipped (no current chunks)' };

  const mongoRes = await MeetingChunk.deleteMany({ meetingId, chunkVersion: { $ne: CURRENT_CHUNK_VERSION } });

  let qdrant = 'disabled';
  if (QDRANT_ENABLED && qdrantClient) {
    await qdrantClient.delete(COLLECTION_NAME, {
      wait: true,
      filter: {
        must: [{ key: 'meetingId', match: { value: String(meetingId) } }],
        must_not: [{ key: 'chunkId', match: { any: keepIds } }],
      },
    });
    qdrant = 'cleaned';
  }
  return { mongo: mongoRes.deletedCount || 0, qdrant };
}

async function reindexAll() {
  let failed = 0;
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const meetings = await Meeting.find({ status: 'completed' })
      .select('title transcript transcriptSegments meetingType')
      .lean();
    console.log(`Found ${meetings.length} completed meetings.`);

    for (const meeting of meetings) {
      const id = meeting._id.toString();
      if (!meeting.transcript) {
        console.log(`\nSkipping ${meeting.title} (${id}): no transcript`);
        continue;
      }
      console.log(`\nProcessing ${meeting.title} (${id})...`);

      const transcriptSegments = (meeting.transcriptSegments || []).map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        speaker: seg.speaker || 'Unknown',
      }));

      const res = await embeddingService.processMeetingEmbeddings(id, meeting.transcript, {
        transcriptSegments,
        chunkType: 'Transcript',
        meetingType: meeting.meetingType || '',
      });
      console.log(
        `  chunks=${res.chunksCreated} reused=${res.chunksSkipped} generated=${res.embeddingsGenerated} failures=${res.failures}`
      );

      if (res.failures > 0 || res.chunksCreated === 0) {
        failed++;
        console.log('  Leaving existing chunks untouched because this meeting did not fully re-index.');
        continue;
      }

      const removed = await removeStale(id);
      console.log(`  removed stale: mongo=${removed.mongo} qdrant=${removed.qdrant}`);
    }

    console.log(failed ? `\nDone with ${failed} meeting(s) not fully re-indexed.` : '\nAll completed meetings re-indexed.');
  } catch (err) {
    failed++;
    console.error('Error during reindexing:', err);
  } finally {
    await mongoose.disconnect();
    process.exitCode = failed ? 1 : 0;
  }
}

reindexAll();
