const validateRetrievalRequest = (question, filters) => {
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new Error('Question must be a non-empty string');
  }
  
  if (question.length > 1000) {
    throw new Error('Question is too long (limit: 1000 characters)');
  }
  
  if (filters && typeof filters !== 'object') {
    throw new Error('Filters must be a valid JSON object');
  }
  
  if (filters && filters.meetingId && typeof filters.meetingId !== 'string') {
    throw new Error('Meeting ID filter must be a string');
  }
  
  return true;
};

module.exports = { validateRetrievalRequest };
