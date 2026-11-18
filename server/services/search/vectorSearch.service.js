const { qdrantClient, COLLECTION_NAME, QDRANT_ENABLED, searchPoints } = require('../embeddings/qdrantStorage');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('./search.constants');
const { buildOwnershipCondition } = require('./meetingAccess');
const embeddingProviderFactory = require('../embeddings/embedding.factory');

class VectorSearchService {
  async search(query, params = {}) {
    const startTime = Date.now();
    // `userId` scopes results to that user's meetings. `unscoped: true` searches
    // the whole collection and is only for offline benchmarks/tests — never
    // pass it from a request handler.
    const { page = 1, limit = DEFAULT_PAGE_SIZE, meetingId, userId, unscoped = false } = params;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));

    if (!query || !query.trim()) {
      return {
        success: true,
        query: '',
        source: QDRANT_ENABLED ? 'vector' : 'unavailable',
        stats: { executionTimeMs: 0, searchedMeetings: 0, returned: 0, vectorSearchAvailable: QDRANT_ENABLED },
        pagination: { page: 1, limit: limitNum, total: 0 },
        results: [],
      };
    }

    const embedding = await this._generateEmbedding(query);
    if (!embedding) {
      return {
        success: true,
        query,
        source: QDRANT_ENABLED ? 'vector_failed' : 'unavailable',
        stats: { executionTimeMs: Date.now() - startTime, searchedMeetings: 0, returned: 0, vectorSearchAvailable: QDRANT_ENABLED },
        pagination: { page: 1, limit: limitNum, total: 0 },
        results: [],
      };
    }

    const mustConditions = [];
    if (unscoped) {
      if (meetingId) mustConditions.push({ key: 'meetingId', match: { value: String(meetingId) } });
    } else {
      const ownership = await buildOwnershipCondition(userId, meetingId);
      if (!ownership) {
        return {
          success: true,
          query,
          source: 'vector',
          stats: { executionTimeMs: Date.now() - startTime, searchedMeetings: 0, returned: 0, vectorSearchAvailable: QDRANT_ENABLED },
          pagination: { page: 1, limit: limitNum, total: 0 },
          results: [],
        };
      }
      mustConditions.push(ownership);
    }

    let searchResults;
    try {
      searchResults = await searchPoints(embedding, { must: mustConditions }, limitNum);
    } catch (err) {
      console.error('[VectorSearch] Qdrant search error:', err.message);
      return {
        success: true,
        query,
        source: 'error',
        stats: { executionTimeMs: Date.now() - startTime, searchedMeetings: 0, returned: 0, vectorSearchAvailable: false },
        pagination: { page: 1, limit: limitNum, total: 0 },
        results: [],
      };
    }

    if (!searchResults) {
      return {
        success: true,
        query,
        source: QDRANT_ENABLED ? 'qdrant_unavailable' : 'unavailable',
        stats: { executionTimeMs: Date.now() - startTime, searchedMeetings: 0, returned: 0, vectorSearchAvailable: QDRANT_ENABLED },
        pagination: { page: 1, limit: limitNum, total: 0 },
        results: [],
      };
    }

    const formattedResults = searchResults.map((r) => ({
      meetingId: r.payload.meetingId,
      chunkId: r.payload.chunkId,
      text: r.payload.text,
      speaker: r.payload.speaker,
      score: r.score,
      metadata: r.payload.metadata || {},
    }));

    return {
      success: true,
      query,
      source: 'vector',
      stats: {
        executionTimeMs: Date.now() - startTime,
        searchedMeetings: searchResults.length,
        returned: formattedResults.length,
        vectorSearchAvailable: QDRANT_ENABLED,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: searchResults.length,
      },
      results: formattedResults,
    };
  }

  async _generateEmbedding(text) {
    if (!QDRANT_ENABLED) return null;
    try {
      // Same provider (and therefore same model/endpoint) as stored chunks,
      // with the query-side task prefix.
      const provider = embeddingProviderFactory.getProvider();
      const [result] = await provider.generateEmbeddings([text], { kind: 'query' });
      return result ? result.vector : null;
    } catch (err) {
      console.error('[VectorSearch] Embedding generation error:', err.message);
      return null;
    }
  }
}

module.exports = new VectorSearchService();
