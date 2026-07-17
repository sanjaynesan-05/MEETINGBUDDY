require('dotenv').config();

module.exports = {
  MAX_QUESTION_LENGTH: parseInt(process.env.CHAT_MAX_QUESTION_LENGTH, 10) || 1000,
  DEFAULT_TEMPLATE: process.env.CHAT_DEFAULT_TEMPLATE || 'chat',
  DEFAULT_TOP_K: parseInt(process.env.CHAT_DEFAULT_TOP_K, 10) || 10,
  REQUEST_TIMEOUT: parseInt(process.env.CHAT_REQUEST_TIMEOUT, 10) || 60000,
  ENABLE_CITATIONS: process.env.CHAT_ENABLE_CITATIONS !== 'false',
  ENABLE_CONFIDENCE: process.env.CHAT_ENABLE_CONFIDENCE !== 'false',
  ENABLE_METADATA: process.env.CHAT_ENABLE_METADATA !== 'false'
};
