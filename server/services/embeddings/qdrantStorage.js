const { QdrantClient } = require('@qdrant/js-client-rest');

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'meeting_chunks';
const VECTOR_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION, 10) || 768;
const QDRANT_TIMEOUT_MS = parseInt(process.env.QDRANT_TIMEOUT_MS || '5000', 10);

const QDRANT_ENABLED = process.env.QDRANT_ENABLED !== 'false';

let qdrantClient;
let _isHealthy = false;
let _healthChecked = false;

try {
  qdrantClient = new QdrantClient({ url: QDRANT_URL });
} catch (e) {
  console.error('[Qdrant] Failed to initialise client:', e.message);
  qdrantClient = null;
}

/**
 * Lightweight reachability check — returns true/false without throwing.
 */
async function checkHealth() {
  if (!QDRANT_ENABLED || !qdrantClient) {
    return { available: false, reason: 'QDRANT_ENABLED is false or client not initialised' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), QDRANT_TIMEOUT_MS);

    const response = await qdrantClient.getCollections({ signal: controller.signal });
    clearTimeout(timeoutId);

    const exists = (response.collections || []).some(c => c.name === COLLECTION_NAME);

    let dimensionMismatch = false;
    if (exists) {
      try {
        const info = await qdrantClient.getCollectionInfo(COLLECTION_NAME, { signal: controller.signal });
        const actualDim = info?.vectors?.size;
        if (actualDim && actualDim !== VECTOR_DIMENSION) {
          dimensionMismatch = true;
          console.warn(`[Qdrant] Vector dimension mismatch: expected=${VECTOR_DIMENSION}, actual=${actualDim}`);
        }
      } catch (_) {
        // Best-effort dimension check
      }
    }

    return {
      available: true,
      collection: COLLECTION_NAME,
      collectionExists: exists,
      vectorDimension: VECTOR_DIMENSION,
      dimensionMismatch,
    };
  } catch (error) {
    return {
      available: false,
      reason: error.message || 'fetch failed',
      collection: COLLECTION_NAME,
      vectorDimension: VECTOR_DIMENSION,
    };
  }
}

/**
 * Initialise / validate collection lazily. Safe — never throws.
 */
async function ensureCollectionExists() {
  if (!QDRANT_ENABLED || !qdrantClient) return false;

  try {
    const response = await qdrantClient.getCollections();
    const exists = response.collections.some(c => c.name === COLLECTION_NAME);
    if (exists) return true;

    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: { size: VECTOR_DIMENSION, distance: 'Cosine' },
    });
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'meetingId',
      field_schema: 'keyword',
    });
    return true;
  } catch (error) {
    console.error('[Qdrant] ensureCollectionExists failed:', error.message);
    return false;
  }
}

async function upsertChunks(chunksWithEmbeddings) {
  if (!chunksWithEmbeddings || chunksWithEmbeddings.length === 0) return 0;
  if (!QDRANT_ENABLED || !qdrantClient) return 0;

  try {
    const created = await ensureCollectionExists();
    if (!created) {
      console.warn('[Qdrant] Collection not available — skipping upsert (data saved to MongoDB)');
      return 0;
    }

    const points = chunksWithEmbeddings.map((item) => {
      const vector = item.embedding && item.embedding.vector ? item.embedding.vector : item.vector;
      return {
        id: item.chunkId,
        vector,
        payload: {
          meetingId: item.meetingId,
          chunkId: item.chunkId,
          chunkIndex: item.chunkIndex || 0,
          speaker: (item.metadata && item.metadata.speaker) || null,
          startTime: (item.metadata && item.metadata.startTime) || null,
          endTime: (item.metadata && item.metadata.endTime) || null,
          meetingType: (item.metadata && item.metadata.meetingType) || '',
          text: item.text,
          metadata: item.metadata || {},
        },
      };
    });

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    return points.length;
  } catch (error) {
    console.error('[Qdrant] upsertChunks failed:', error.message);
    return 0;
  }
}

async function deleteChunksForMeeting(meetingId) {
  if (!meetingId) return 0;
  if (!QDRANT_ENABLED || !qdrantClient) return 0;

  try {
    await qdrantClient.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: 'meetingId', match: { value: meetingId } }],
      },
    });
  } catch (error) {
    console.error('[Qdrant] deleteChunksForMeeting failed:', error.message);
  }

  return 0;
}

async function searchPoints(vector, filter, limit) {
  if (!QDRANT_ENABLED || !qdrantClient) return null;

  try {
    const searchParams = {
      vector,
      limit,
      with_payload: true,
      with_vector: false,
    };
    if (filter && Object.keys(filter).length > 0) {
      searchParams.filter = filter;
    }

    const results = await qdrantClient.search(COLLECTION_NAME, searchParams);
    return results || [];
  } catch (error) {
    console.error('[Qdrant] searchPoints failed:', error.message);
    return null;
  }
}

module.exports = {
  qdrantClient,
  COLLECTION_NAME,
  VECTOR_DIMENSION,
  QDRANT_ENABLED,
  checkHealth,
  ensureCollectionExists,
  upsertChunks,
  deleteChunksForMeeting,
  searchPoints,
};
