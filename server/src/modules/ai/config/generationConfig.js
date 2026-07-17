require('dotenv').config();

module.exports = {
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.1',
  REQUEST_TIMEOUT: parseInt(process.env.GENERATION_REQUEST_TIMEOUT, 10) || 60000,
  MAX_RESPONSE_TOKENS: parseInt(process.env.MAX_RESPONSE_TOKENS, 10) || 1024,
  TEMPERATURE: parseFloat(process.env.GENERATION_TEMPERATURE) || 0.3,
  TOP_P: parseFloat(process.env.GENERATION_TOP_P) || 0.9,
  TOP_K: parseInt(process.env.GENERATION_TOP_K, 10) || 40,
  REPEAT_PENALTY: parseFloat(process.env.GENERATION_REPEAT_PENALTY) || 1.1,
  ENABLE_CITATIONS: process.env.GENERATION_ENABLE_CITATIONS !== 'false',
  ENABLE_CONFIDENCE: process.env.GENERATION_ENABLE_CONFIDENCE !== 'false',
  ENABLE_METADATA: process.env.GENERATION_ENABLE_METADATA !== 'false'
};
