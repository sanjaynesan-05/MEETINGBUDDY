// Shared setup for the automated test suite (node --test).
//
// Environment is set BEFORE the app is loaded; dotenv never overrides values
// that already exist, so these win over server/.env.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/meetingbuddy_test';
process.env.QDRANT_ENABLED = 'false'; // vector search is not needed for API tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-jwt-secret';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
process.env.CHAT_RATE_LIMIT_MAX = '10000';
process.env.SEARCH_RATE_LIMIT_MAX = '10000';

const crypto = require('crypto');
const mongoose = require('mongoose');
const request = require('supertest');

// Safety: these tests drop collections. Never run them against a real database.
const dbName = new URL(process.env.MONGO_URI).pathname.replace('/', '');
if (!/test/i.test(dbName)) {
  throw new Error(`Refusing to run tests against database "${dbName}". Use a database whose name contains "test".`);
}

const app = require('../app');
const Meeting = require('../models/Meeting');
const MeetingChunk = require('../models/MeetingChunk');
const User = require('../models/User');

async function connect() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  await Promise.all([User.deleteMany({}), Meeting.deleteMany({}), MeetingChunk.deleteMany({})]);
  await MeetingChunk.createIndexes();
}

async function disconnect() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

/** Register a fresh user and return { token, user, agent }. */
async function createUser(name = 'Test User') {
  const email = `t-${crypto.randomBytes(5).toString('hex')}@example.test`;
  const password = 'Pw!' + crypto.randomBytes(8).toString('hex');
  const res = await request(app).post('/api/auth/register').send({ name, email, password });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.token, user: res.body.user, email, password };
}

/** Insert a completed meeting (with transcript and keyword-searchable chunks) owned by userId. */
async function createMeeting(userId, { title = 'Planning meeting', transcript, filePath = null } = {}) {
  const text = transcript || 'We agreed to migrate the billing service to the new cluster. Priya owns the rollout plan.';
  const meeting = await Meeting.create({
    title,
    originalFileName: 'audio.mp3',
    storedFileName: `${crypto.randomUUID()}.mp3`, // unique index
    filePath: filePath || '/nonexistent/audio.mp3',
    fileType: 'audio',
    mimeType: 'audio/mpeg',
    fileSize: 1000,
    status: 'completed',
    transcriptionStatus: 'completed',
    embeddingStatus: 'completed',
    uploadedBy: userId,
    transcript: text,
    transcriptSegments: [{ start: 0, end: 5, text, speaker: 'SPEAKER_00' }],
    aiAnalysis: {
      summary: 'Billing migration planning.',
      actionItems: [{ task: 'Write the rollout plan', owner: 'Priya', deadline: '', priority: 'High', status: 'Pending' }],
    },
  });
  await MeetingChunk.create({
    meetingId: meeting._id,
    chunkId: `chk_${meeting._id}_v3_idx0`,
    chunkIndex: 0,
    chunkVersion: 3,
    contentHash: crypto.createHash('sha256').update(text).digest('hex'),
    text,
    embedding: { vector: [0.1, 0.2], model: 'test', provider: 'test', dimensions: 2 },
    metadata: { speaker: 'SPEAKER_00', startTime: 0, endTime: 5, tokenEstimate: 20, chunkType: 'Transcript' },
  });
  return meeting;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { app, request, connect, disconnect, createUser, createMeeting, auth, Meeting, MeetingChunk };
