require('dotenv').config();

const config = {
  OLLAMA_BASE_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
  EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION, 10) || 768,
  TIMEOUT: 30000 // 30 seconds default timeout
};

module.exports = config;
