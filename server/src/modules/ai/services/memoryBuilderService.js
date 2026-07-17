const { trimMemoryWindow, enforceCharacterLimit } = require('./windowManagerService');

const buildMemoryContext = (session) => {
  if (!session || !session.messages || session.messages.length === 0) {
    return [];
  }
  
  let memory = [...session.messages];
  
  memory = trimMemoryWindow(memory);
  memory = enforceCharacterLimit(memory);
  
  memory = memory.filter(msg => msg.content && msg.content.length > 0);
  
  return memory;
};

module.exports = { buildMemoryContext };
