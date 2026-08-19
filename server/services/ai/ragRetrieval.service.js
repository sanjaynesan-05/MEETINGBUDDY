const rrfService = require('../search/rrf.service');
const searchService = require('../search/search.service');
const Meeting = require('../../models/Meeting');
const MeetingChunk = require('../../models/MeetingChunk');
const { QDRANT_ENABLED } = require('../embeddings/qdrantStorage');

const DEFAULT_TOP_N = 5;
const MAX_CONTEXT_CHARS = 10000;

class RagRetrievalService {
  async retrieveForChat({ question, meetingId, userId, topN = DEFAULT_TOP_N }) {
    if (!question || !question.trim()) {
      return { chunks: [], totalChars: 0, source: 'empty' };
    }

    const params = { q: question, limit: topN * 2 };
    if (meetingId && meetingId !== 'all') params.meetingId = meetingId;

    let results = [];
    let retrievalSource = 'none';

    // Step 1: Try hybrid search (keyword + vector via Qdrant)
    try {
      const hybridRes = await rrfService.hybridSearch(userId, params);
      results = hybridRes.results || [];
      if (results.length > 0) {
        retrievalSource = 'hybrid';
      }
    } catch (err) {
      console.warn('[RagRetrieval] Hybrid search failed, attempting keyword search:', err.message);
      try {
        const kwRes = await searchService.search(userId, params);
        results = kwRes.results || [];
        if (results.length > 0) {
          retrievalSource = 'keyword';
        }
      } catch (kwErr) {
        console.warn('[RagRetrieval] Keyword search failed:', kwErr.message);
      }
    }

    // Step 2: If no results from search, fall back to MongoDB direct retrieval
    if (results.length === 0) {
      console.log('[RAG] Falling back to MongoDB transcript context...');
      try {
        const meetingQuery = { status: 'completed' };
        if (userId) meetingQuery.uploadedBy = userId;
        if (meetingId && meetingId !== 'all') meetingQuery._id = meetingId;

        const meetings = await Meeting.find(meetingQuery).limit(5).lean();

        for (const meeting of meetings) {
          // Check chunks first (vector chunks stored in MongoDB)
          const dbChunks = await MeetingChunk.find({ meetingId: meeting._id }).limit(3).lean();
          if (dbChunks && dbChunks.length > 0) {
            for (const c of dbChunks) {
              results.push({
                meetingId: meeting._id.toString(),
                meetingTitle: meeting.title,
                snippet: c.text,
                score: 0.5,
              });
            }
          } else if (meeting.transcript) {
            // Fallback to raw transcript snippet
            const snippet = meeting.transcript.slice(0, 1000);
            results.push({
              meetingId: meeting._id.toString(),
              meetingTitle: meeting.title,
              snippet,
              score: 0.5,
            });
          }
        }
        if (results.length > 0) {
          retrievalSource = 'mongodb_fallback';
        }
      } catch (dbErr) {
        console.error('[RagRetrieval] MongoDB fallback retrieval failed:', dbErr.message);
      }
    }

    const chunks = [];
    let totalChars = 0;

    for (const item of results) {
      const text = item.snippet || item.text || '';
      if (!text.trim()) continue;

      const chunk = {
        meetingId: item.meetingId,
        meetingTitle: item.meetingTitle || '',
        snippet: text,
        score: item.rrfScore || item.score || 0,
        sourceLabel: `[S${chunks.length + 1}]`,
      };

      if (totalChars + text.length > MAX_CONTEXT_CHARS && chunks.length > 0) break;
      chunks.push(chunk);
      totalChars += text.length;

      if (chunks.length >= topN) break;
    }

    console.log(`[RAG] Retrieval source: ${retrievalSource}, chunks: ${chunks.length}, qdrantEnabled: ${QDRANT_ENABLED}`);

    return { chunks, totalChars, source: retrievalSource };
  }
}

module.exports = new RagRetrievalService();
