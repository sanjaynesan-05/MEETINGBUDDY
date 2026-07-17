const { executeChatPipeline } = require('../services/chatOrchestratorService');

const handleChatRequest = async (req, res) => {
  try {
    const { question, filters, sessionId } = req.body;
    
    const response = await executeChatPipeline(question, filters || {}, sessionId);
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Chat orchestrator error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error processing chat request'
    });
  }
};

const getHealth = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      chatReady: true,
      retriever: true,
      promptBuilder: true,
      generation: true,
      status: 'healthy'
    });
  } catch (error) {
    console.error('Chat health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Chat health check failed'
    });
  }
};

module.exports = { handleChatRequest, getHealth };
