module.exports = {
  MAX_CHUNK_SIZE: 500,          // Maximum character size per chunk
  MIN_CHUNK_SIZE: 50,           // Minimum character size before merging
  MAX_BATCH_SIZE: 5,            // Maximum chunks to embed per batch request
  TOKEN_ESTIMATION_RATIO: 0.25, // Estimate tokens as length / 4 (or length * 0.25)
  DEFAULT_PROVIDER: process.env.EMBEDDING_PROVIDER || 'ollama',
  DEFAULT_MODEL: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
  CURRENT_CHUNK_VERSION: 1,
  RETRY_LIMIT: 3,
  RETRY_DELAY_MS: 1000,
};
