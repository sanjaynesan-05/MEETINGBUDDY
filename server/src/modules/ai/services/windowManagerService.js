const config = require('../config/conversationConfig');

const trimMemoryWindow = (messages) => {
  if (messages.length <= config.MEMORY_WINDOW_SIZE) {
    return messages;
  }
  return messages.slice(-config.MEMORY_WINDOW_SIZE);
};

const enforceCharacterLimit = (messages) => {
  let totalChars = 0;
  const validMessages = [];
  
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgLength = msg.content ? msg.content.length : 0;
    
    if (totalChars + msgLength > config.MAX_MEMORY_CHARACTERS) {
      break;
    }
    
    totalChars += msgLength;
    validMessages.unshift(msg);
  }
  
  return validMessages;
};

module.exports = { trimMemoryWindow, enforceCharacterLimit };
