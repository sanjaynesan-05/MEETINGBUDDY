const { qdrantClient, COLLECTION_NAME, QDRANT_ENABLED, searchPoints } = require('../embeddings/qdrantStorage');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('./search.constants');

class VectorSearchService {
  async search(query, params = {}) {
    const startTime = Date.now();
    const { page = 1, limit = DEFAULT_PAGE_SIZE, meetingId } = params;

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
    if (meetingId) {
      mustConditions.push({ key: 'meetingId', match: { value: meetingId } });
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
      const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
      const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
      const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.embedding;
    } catch (err) {
      console.error('[VectorSearch] Embedding generation error:', err.message);
      return null;
    }
  }
}

module.exports = new VectorSearchService();
