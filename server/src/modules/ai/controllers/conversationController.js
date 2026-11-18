const { validateConversationRequest } = require('../utils/conversationValidator');
const { processConversation } = require('../services/conversationService');
const { expireSession } = require('../services/sessionService');
const config = require('../config/conversationConfig');

const handleConversation = async (req, res) => {
  try {
    const { sessionId, question, meetingId } = req.body;
    
    validateConversationRequest(sessionId, question, meetingId);
    
    const response = await processConversation(sessionId, question, meetingId, req.user._id);
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Conversation processing error:', error);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Internal server error processing conversation'
    });
  }
};

const getSession = async (req, res) => {
  return res.status(200).json({ success: true, sessionId: req.params.sessionId });
};

const deleteSession = async (req, res) => {
  try {
    const deleted = await expireSession(req.params.sessionId, req.user._id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Session not found' });
    return res.status(200).json({ success: true, message: 'Session deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete session' });
  }
};

const getHealth = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      memoryEnabled: config.ENABLE_MEMORY,
      summarizer: config.ENABLE_SUMMARIZATION,
      sessionStore: true,
      status: "healthy"
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Health check failed' });
  }
};

module.exports = { handleConversation, getSession, deleteSession, getHealth };
