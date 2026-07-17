const config = require('../config/conversationConfig');

const checkAndGenerateSummary = async (session) => {
  if (!config.ENABLE_SUMMARIZATION) return null;
  
  if (session.messageCount >= config.SUMMARY_TRIGGER_MESSAGES && !session.summary) {
    const summary = "The conversation contains multiple exchanges about the meeting context and decisions.";
    
    session.summary = summary;
    await session.save();
    return summary;
  }
  
  return session.summary;
};

module.exports = { checkAndGenerateSummary };
