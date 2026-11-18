const { qdrantClient, QDRANT_ENABLED } = require('../config/qdrant');
const config = require('../config/retrievalConfig');
const Meeting = require('../../../../models/Meeting');
const { generateEmbedding: generateDbEmbedding } = require('./embeddingService');
const { v4: uuidv4 } = require('uuid');
const { buildOwnershipCondition, getOwnedMeetingIds } = require('../../../../services/search/meetingAccess');

// userId is required: results are always restricted to the caller's own meetings.
const searchQdrant = async (queryVector, filters = {}, userId) => {
  console.log('Searching Qdrant...');

  if (!QDRANT_ENABLED || !qdrantClient) {
    console.warn('[Qdrant] Qdrant is disabled or unavailable. Returning empty results.');
    return [];
  }

  const ownership = await buildOwnershipCondition(userId, filters.meetingId);
  if (!ownership) return []; // user owns no (matching) meetings

  const mustConditions = [ownership];

  if (filters.meetingType) {
    mustConditions.push({ key: 'meetingType', match: { value: filters.meetingType } });
  }
  if (filters.speaker) {
    mustConditions.push({ key: 'speaker', match: { value: filters.speaker } });
  }
  if (filters.date) {
    mustConditions.push({ key: 'date', match: { value: filters.date } });
  }
  if (filters.keywords && Array.isArray(filters.keywords)) {
    for (const kw of filters.keywords) {
      mustConditions.push({ key: 'keywords', match: { value: kw } });
    }
  }

  const searchParams = {
    vector: queryVector,
    limit: config.TOP_K,
    with_payload: true,
    with_vector: false,
  };

  if (mustConditions.length > 0) {
    searchParams.filter = { must: mustConditions };
  }

  try {
    const searchResults = await qdrantClient.search(config.DEFAULT_COLLECTION, searchParams);
    console.log(`Retrieved ${searchResults.length} chunks`);
    return searchResults || [];
  } catch (error) {
    console.error('[Qdrant] Search failed — returning empty results (fallback will be used):', error.message);
    return [];
  }
};

const searchMongoDB = async (question, filters = {}, userId) => {
  console.log('[Qdrant] Falling back to MongoDB transcript search...');
  const owned = await getOwnedMeetingIds(userId);
  if (owned.length === 0) return [];
  const meetingQuery = { status: 'completed', _id: { $in: owned } };
  if (filters.meetingId) {
    if (!owned.includes(String(filters.meetingId))) return [];
    meetingQuery._id = filters.meetingId;
  }

  const meetings = await Meeting.find(meetingQuery).limit(5).lean();

  const chunks = [];
  for (const meeting of meetings) {
    if (meeting.transcript && meeting.transcript.length > 0) {
      chunks.push({
        id: meeting._id.toString(),
        version: 1,
        score: 0.5,
        payload: {
          meetingId: meeting._id.toString(),
          meetingTitle: meeting.title,
          text: meeting.transcript.slice(0, 1000),
          speaker: null,
          startTime: 0,
          endTime: meeting.duration || 0,
          metadata: {},
        },
      });
    }
  }

  console.log(`[MongoFallback] Retrieved ${chunks.length} chunks from MongoDB`);
  return chunks;
};

module.exports = { searchQdrant, searchMongoDB };
