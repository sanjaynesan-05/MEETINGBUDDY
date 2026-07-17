require('dotenv').config();

module.exports = {
  TOP_K: parseInt(process.env.RETRIEVAL_TOP_K, 10) || 10,
  MIN_SCORE: parseFloat(process.env.RETRIEVAL_MIN_SCORE) || 0.6,
  MAX_CONTEXT_CHUNKS: parseInt(process.env.RETRIEVAL_MAX_CONTEXT_CHUNKS, 10) || 5,
  MAX_CONTEXT_CHARACTERS: parseInt(process.env.RETRIEVAL_MAX_CONTEXT_CHARACTERS, 10) || 10000,
  DEFAULT_COLLECTION: process.env.QDRANT_COLLECTION || 'meeting_chunks',
  DISTANCE_METRIC: 'Cosine'
};
