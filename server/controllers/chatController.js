const ragChatService = require('../services/ai/ragChat.service');

exports.sendChatMessage = async (req, res, next) => {
  try {
    const { question, meetingId, conversationHistory } = req.body;
    const userId = req.user.id;

    const result = await ragChatService.chat({
      question,
      meetingId: meetingId || null,
      userId,
      conversationHistory: conversationHistory || [],
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('[ChatController] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat message',
    });
  }
};
