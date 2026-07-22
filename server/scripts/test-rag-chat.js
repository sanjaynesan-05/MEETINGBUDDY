const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Meeting = require('../models/Meeting');
const ragChatService = require('../services/ai/ragChat.service');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_intelligence';

async function testChat() {
  try {
    await mongoose.connect(mongoUri);
    console.log('🔌 Connected to MongoDB');

    const meeting = await Meeting.findOne({ status: 'completed' });
    if (!meeting) {
      console.log('No completed meeting found.');
      return;
    }

    console.log(`Testing RAG Chat for meeting: ${meeting.title} (${meeting._id})...`);
    const question = 'What decisions were made?';

    const result = await ragChatService.chat({
      question,
      meetingId: meeting._id.toString(),
      userId: meeting.uploadedBy.toString(),
      conversationHistory: [],
    });

    console.log('\n--- RAG CHAT ANSWER ---');
    console.log(result.answer);
    console.log('\n--- CITATIONS ---');
    console.log(JSON.stringify(result.citations, null, 2));
    console.log('\n--- METADATA ---');
    console.log(result.metadata);
  } catch (err) {
    console.error('❌ RAG Chat test error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

testChat();
