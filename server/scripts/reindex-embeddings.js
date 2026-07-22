const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Meeting = require('../models/Meeting');
const embeddingService = require('../services/embeddings/embedding.service');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_intelligence';

async function reindexAll() {
  try {
    await mongoose.connect(mongoUri);
    console.log('🔌 Connected to MongoDB');

    const meetings = await Meeting.find({ status: 'completed' });
    console.log(`Found ${meetings.length} completed meetings for embedding generation.`);

    for (const meeting of meetings) {
      if (!meeting.transcript) continue;
      console.log(`\nProcessing embeddings for meeting: ${meeting.title} (${meeting._id})...`);
      const res = await embeddingService.processMeetingEmbeddings(meeting._id.toString(), meeting.transcript);
      console.log(`Result: Chunks Created=${res.chunksCreated}, Skipped=${res.chunksSkipped}, Generated=${res.embeddingsGenerated}, Failures=${res.failures}`);
    }

    console.log('\n✅ All completed meetings processed successfully.');
  } catch (err) {
    console.error('❌ Error during reindexing:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

reindexAll();
