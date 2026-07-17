const validateConversationRequest = (sessionId, question, meetingId) => {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Valid sessionId is required');
  }
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new Error('Valid question is required');
  }
  if (meetingId && typeof meetingId !== 'string') {
    throw new Error('meetingId must be a string');
  }
  return true;
};

module.exports = { validateConversationRequest };
