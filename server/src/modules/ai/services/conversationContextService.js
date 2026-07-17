const { v4: uuidv4 } = require('uuid');

const generateContextMetadata = (sessionId = null) => {
  return {
    requestId: uuidv4(),
    sessionId: sessionId || uuidv4(),
    timestamp: new Date().toISOString()
  };
};

module.exports = { generateContextMetadata };
