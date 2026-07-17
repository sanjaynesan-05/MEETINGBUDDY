const appendMessages = async (session, userMessage, aiMessage) => {
  const newMessages = [];
  
  if (userMessage) {
    newMessages.push({
      role: 'user',
      content: userMessage.content,
      timestamp: new Date(),
      metadata: userMessage.metadata
    });
  }
  
  if (aiMessage) {
    newMessages.push({
      role: 'assistant',
      content: aiMessage.content,
      timestamp: new Date(),
      metadata: aiMessage.metadata
    });
  }
  
  session.messages.push(...newMessages);
  session.messageCount += newMessages.length;
  
  await session.save();
  return session;
};

const loadMessages = (session) => {
  return session.messages || [];
};

module.exports = { appendMessages, loadMessages };
