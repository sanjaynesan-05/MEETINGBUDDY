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

/**
 * POST /api/chat/stream
 * Streams the answer as Server-Sent Events over the POST response.
 * Each event is one `data: <json>` line followed by a blank line:
 *   {"type":"context","chunksUsed":5,"retrievalSource":"hybrid"}
 *   {"type":"token","text":"..."}            (many)
 *   {"type":"done","answer":...,"citations":[...],"metadata":{...}}
 *   {"type":"error","message":"..."}
 */
exports.streamChatMessage = async (req, res) => {
  const { question, meetingId, conversationHistory } = req.body || {};

  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  // Stop generating if the user navigates away or cancels.
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  const send = (event) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await ragChatService.chatStream({
      question,
      meetingId: meetingId || null,
      userId: req.user.id,
      conversationHistory: conversationHistory || [],
      onEvent: send,
      signal: controller.signal,
    });
  } catch (error) {
    console.error('[ChatController] Stream error:', error.message);
    send({ type: 'error', message: 'The assistant could not answer right now. Please try again.' });
  } finally {
    if (!res.writableEnded) res.end();
  }
};
