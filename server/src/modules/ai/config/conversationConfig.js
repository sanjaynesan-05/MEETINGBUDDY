require('dotenv').config();

module.exports = {
  MAX_HISTORY_MESSAGES: parseInt(process.env.MAX_HISTORY_MESSAGES, 10) || 20,
  MAX_MEMORY_CHARACTERS: parseInt(process.env.MAX_MEMORY_CHARACTERS, 10) || 4000,
  SUMMARY_TRIGGER_MESSAGES: parseInt(process.env.SUMMARY_TRIGGER_MESSAGES, 10) || 10,
  SESSION_TIMEOUT_MINUTES: parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10) || 60,
  ENABLE_SUMMARIZATION: process.env.ENABLE_SUMMARIZATION !== 'false',
  ENABLE_MEMORY: process.env.ENABLE_MEMORY !== 'false',
  MEMORY_WINDOW_SIZE: parseInt(process.env.MEMORY_WINDOW_SIZE, 10) || 10
};
