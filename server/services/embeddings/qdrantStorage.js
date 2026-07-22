const { QdrantClient } = require('@qdrant/js-client-rest');

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'meeting_chunks';
const VECTOR_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION, 10) || 768;

const qdrantClient = new QdrantClient({ url: QDRANT_URL });

async function ensureCollectionExists() {
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
}

async function upsertChunks(chunksWithEmbeddings) {
  if (!chunksWithEmbeddings || chunksWithEmbeddings.length === 0) return 0;

  await ensureCollectionExists();

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

  const result = await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });

  return points.length;
}

async function deleteChunksForMeeting(meetingId) {
  if (!meetingId) return 0;

  await qdrantClient.delete(COLLECTION_NAME, {
    filter: {
      must: [{ key: 'meetingId', match: { value: meetingId } }],
    },
  });

  return 0;
}

module.exports = { upsertChunks, deleteChunksForMeeting, qdrantClient, COLLECTION_NAME };
