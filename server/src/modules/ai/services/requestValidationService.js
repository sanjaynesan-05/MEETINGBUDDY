const config = require('../config/chatConfig');

const validateChatRequest = (question, filters) => {
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new Error('Question is missing or empty');
  }
  
  if (question.length > config.MAX_QUESTION_LENGTH) {
    throw new Error(`Question exceeds max length of ${config.MAX_QUESTION_LENGTH} characters`);
  }
  
  if (filters && typeof filters !== 'object') {
    throw new Error('Filters must be a valid JSON object');
  }
  
  return true;
};

module.exports = { validateChatRequest };
