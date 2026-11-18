const Conversation = require('../models/Conversation');
const config = require('../config/conversationConfig');

const getOrCreateSession = async (sessionId, meetingId, userId) => {
  if (!userId) throw new Error('userId is required');
  userId = String(userId);
  let session = await Conversation.findOne({ sessionId });

  if (session && session.userId !== userId) {
    // Session IDs are client-chosen; never let one user continue another's session.
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }

  if (!session) {
    session = new Conversation({
      sessionId,
      meetingId,
      userId,
      messages: [],
      messageCount: 0
    });
    await session.save();
  } else {
    const lastUpdate = session.updatedAt || session.createdAt;
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    
    if (diffMinutes > config.SESSION_TIMEOUT_MINUTES) {
      session.messages = [];
      session.summary = null;
      session.messageCount = 0;
      await session.save();
    }
  }
  
  return session;
};

const expireSession = async (sessionId, userId) => {
  return await Conversation.findOneAndDelete({ sessionId, userId: String(userId) });
};

module.exports = { getOrCreateSession, expireSession };
