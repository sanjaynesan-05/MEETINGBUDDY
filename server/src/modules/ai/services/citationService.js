const buildCitations = (contextChunks) => {
  console.log('Building citations...');
  
  if (!contextChunks || !Array.isArray(contextChunks)) {
    return [];
  }
  
  return contextChunks.map(chunk => ({
    meetingId: chunk.meetingId || 'Unknown',
    chunkId: chunk.chunkId || 'Unknown',
    speaker: chunk.speaker || 'Unknown',
    startTime: chunk.startTime || '00:00:00',
    endTime: chunk.endTime || '00:00:00',
    similarityScore: chunk.similarityScore || 0
  }));
};

module.exports = { buildCitations };
