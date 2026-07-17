const config = require('../config/retrievalConfig');

const buildContext = (rankedResults) => {
  const context = [];
  let totalCharacters = 0;
  
  for (const result of rankedResults) {
    if (context.length >= config.MAX_CONTEXT_CHUNKS) {
      break;
    }
    
    const payload = result.payload;
    const textLength = payload.text.length;
    
    if (totalCharacters + textLength > config.MAX_CONTEXT_CHARACTERS && context.length > 0) {
      break;
    }
    
    context.push({
      chunkId: payload.chunkId || result.id,
      meetingId: payload.meetingId,
      speaker: payload.speaker || null,
      startTime: payload.startTime || null,
      endTime: payload.endTime || null,
      similarityScore: result.score,
      text: payload.text,
      metadata: payload.metadata || {}
    });
    
    totalCharacters += textLength;
  }
  
  console.log(`Final context size ${context.length}`);
  return context;
};

module.exports = { buildContext };
