const Conversation = require('../models/Conversation');
const config = require('../config/conversationConfig');

const getOrCreateSession = async (sessionId, meetingId, userId = 'anonymous') => {
  let session = await Conversation.findOne({ sessionId });
  
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

const expireSession = async (sessionId) => {
  return await Conversation.findOneAndDelete({ sessionId });
};

module.exports = { getOrCreateSession, expireSession };
