const crypto = require('crypto');
const { QdrantClient } = require('@qdrant/js-client-rest');

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'meeting_chunks';
const VECTOR_DIMENSION =
  parseInt(process.env.EMBEDDING_DIMENSION, 10) || 768;
const QDRANT_TIMEOUT_MS =
  parseInt(process.env.QDRANT_TIMEOUT_MS || '5000', 10);

const QDRANT_ENABLED = process.env.QDRANT_ENABLED !== 'false';

let qdrantClient;
let _isHealthy = false;
let _healthChecked = false;

try {
  qdrantClient = new QdrantClient({
    url: QDRANT_URL,
  });
} catch (e) {
  console.error('[Qdrant] Failed to initialise client:', e.message);
  qdrantClient = null;
}

/**
 * Convert the application's deterministic chunkId into a
 * deterministic UUID-compatible Qdrant point ID.
 *
 * The original chunkId is still stored in the payload, so
 * MongoDB and Qdrant can be mapped back to each other.
 *
 * Example:
 *   chk_<meetingId>_v1_idx0
 *          â†“
 *   deterministic UUID
 */
function qdrantPointId(chunkId) {
  if (!chunkId) {
    throw new Error('chunkId is required to generate Qdrant point ID');
  }

  const hash = crypto
    .createHash('sha256')
    .update(String(chunkId))
    .digest('hex');

  // Convert SHA-256 hash into a valid UUID.
  // Version 5 style UUID + RFC 4122 variant.
  const hex = hash.substring(0, 32);

  const versioned = `5${hex.substring(13, 16)}`;
  const variant = `8${hex.substring(17, 20)}`;

  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    versioned,
    variant,
    hex.substring(20, 32),
  ].join('-');
}

/**
 * Lightweight reachability check.
 * Returns true/false without throwing.
 */
async function checkHealth() {
  if (!QDRANT_ENABLED || !qdrantClient) {
    return {
      available: false,
      reason: 'QDRANT_ENABLED is false or client not initialised',
    };
  }

  try {
    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      QDRANT_TIMEOUT_MS
    );

    const response = await qdrantClient.getCollections({
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const exists = (response.collections || []).some(
      (c) => c.name === COLLECTION_NAME
    );

    let dimensionMismatch = false;

    if (exists) {
      try {
        const info = await qdrantClient.getCollectionInfo(
          COLLECTION_NAME,
          {
            signal: controller.signal,
          }
        );

        const actualDim = info?.vectors?.size;

        if (actualDim && actualDim !== VECTOR_DIMENSION) {
          dimensionMismatch = true;

          console.warn(
            `[Qdrant] Vector dimension mismatch: expected=${VECTOR_DIMENSION}, actual=${actualDim}`
          );
        }
      } catch (_) {
        // Best-effort dimension check.
      }
    }

    _isHealthy = true;
    _healthChecked = true;

    return {
      available: true,
      collection: COLLECTION_NAME,
      collectionExists: exists,
      vectorDimension: VECTOR_DIMENSION,
      dimensionMismatch,
    };
  } catch (error) {
    _isHealthy = false;
    _healthChecked = true;

    return {
      available: false,
      reason: error.message || 'fetch failed',
      collection: COLLECTION_NAME,
      vectorDimension: VECTOR_DIMENSION,
    };
  }
}

/**
 * Initialise / validate collection lazily.
 * Safe â€” never throws.
 */
async function ensureCollectionExists() {
  if (!QDRANT_ENABLED || !qdrantClient) {
    return false;
  }

  try {
    const response = await qdrantClient.getCollections();

    const exists = response.collections.some(
      (c) => c.name === COLLECTION_NAME
    );

    if (exists) {
      return true;
    }

    console.log(
      `[Qdrant] Creating collection "${COLLECTION_NAME}"...`
    );

    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_DIMENSION,
        distance: 'Cosine',
      },
    });

    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'meetingId',
      field_schema: 'keyword',
    });

    console.log(
      `[Qdrant] Collection "${COLLECTION_NAME}" created successfully`
    );

    return true;
  } catch (error) {
    console.error(
      '[Qdrant] ensureCollectionExists failed:',
      error.message
    );

    return false;
  }
}

/**
 * Validate an embedding before sending it to Qdrant.
 */
function validateVector(vector, chunkId) {
  if (!Array.isArray(vector)) {
    throw new Error(
      `Invalid embedding vector for chunk ${chunkId}: vector is not an array`
    );
  }

  if (vector.length !== VECTOR_DIMENSION) {
    throw new Error(
      `Vector dimension mismatch for chunk ${chunkId}: ` +
        `expected ${VECTOR_DIMENSION}, got ${vector.length}`
    );
  }

  if (!vector.every((value) => Number.isFinite(value))) {
    throw new Error(
      `Invalid embedding vector for chunk ${chunkId}: vector contains non-finite values`
    );
  }
}

/**
 * Upsert meeting chunks into Qdrant.
 *
 * MongoDB chunkId:
 *   chk_<meetingId>_v1_idx0
 *
 * Qdrant point ID:
 *   deterministic UUID generated from chunkId
 *
 * Original chunkId is retained in the payload.
 */
async function upsertChunks(chunksWithEmbeddings) {
  if (
    !chunksWithEmbeddings ||
    chunksWithEmbeddings.length === 0
  ) {
    return 0;
  }

  if (!QDRANT_ENABLED || !qdrantClient) {
    console.warn('[Qdrant] Disabled or client unavailable');
    return 0;
  }

  try {
    const created = await ensureCollectionExists();

    if (!created) {
      console.warn(
        '[Qdrant] Collection not available â€” skipping upsert (data saved to MongoDB)'
      );

      return 0;
    }

    const points = chunksWithEmbeddings.map((item) => {
      const vector =
        item.embedding && item.embedding.vector
          ? item.embedding.vector
          : item.vector;

      validateVector(vector, item.chunkId);

      const pointId = qdrantPointId(item.chunkId);

      return {
        id: pointId,

        vector,

        payload: {
          meetingId: String(item.meetingId),

          // Preserve the original application/MongoDB chunk ID.
          chunkId: item.chunkId,

          chunkIndex:
            typeof item.chunkIndex === 'number'
              ? item.chunkIndex
              : 0,

          speaker:
            (item.metadata && item.metadata.speaker) || null,

          startTime:
            (item.metadata && item.metadata.startTime) || null,

          endTime:
            (item.metadata && item.metadata.endTime) || null,

          meetingType:
            (item.metadata && item.metadata.meetingType) || '',

          text: item.text,

          metadata: item.metadata || {},
        },
      };
    });

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    console.log(
      `[Qdrant] Successfully indexed ${points.length} vectors`
    );

    return points.length;
  } catch (error) {
    console.error(
      '[Qdrant] upsertChunks failed:',
      error.message
    );

    return 0;
  }
}

/**
 * Delete all Qdrant chunks belonging to a meeting.
 */
async function deleteChunksForMeeting(meetingId) {
  if (!meetingId) {
    return 0;
  }

  if (!QDRANT_ENABLED || !qdrantClient) {
    return 0;
  }

  try {
    await ensureCollectionExists();

    await qdrantClient.delete(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'meetingId',
            match: {
              value: String(meetingId),
            },
          },
        ],
      },

      wait: true,
    });

    console.log(
      `[Qdrant] Deleted vectors for meeting ${meetingId}`
    );

    return 0;
  } catch (error) {
    console.error(
      '[Qdrant] deleteChunksForMeeting failed:',
      error.message
    );

    return 0;
  }
}

/**
 * Vector similarity search.
 */
async function searchPoints(vector, filter, limit = 10) {
  if (!QDRANT_ENABLED || !qdrantClient) {
    return null;
  }

  try {
    validateVector(vector, 'search');

    const searchParams = {
      vector,
      limit,
      with_payload: true,
      with_vector: false,
    };

    if (
      filter &&
      typeof filter === 'object' &&
      Object.keys(filter).length > 0
    ) {
      searchParams.filter = filter;
    }

    const results = await qdrantClient.search(
      COLLECTION_NAME,
      searchParams
    );

    return results || [];
  } catch (error) {
    console.error(
      '[Qdrant] searchPoints failed:',
      error.message
    );

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
  qdrantPointId,
};
