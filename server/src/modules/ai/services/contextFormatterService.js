const config = require('../config/promptConfig');

const formatContext = (contextChunks) => {
  console.log('Formatting context...');
  
  if (!contextChunks || contextChunks.length === 0) {
    return 'MEETING CONTEXT\n\nNo meeting context available.\n\n';
  }
  
  let formatted = 'MEETING CONTEXT\n\nMeeting Information:\n';
  
  const firstChunk = contextChunks[0];
  formatted += `Meeting ID: ${firstChunk.meetingId || 'Unknown'}\n`;
  if (firstChunk.metadata?.meetingType) {
    formatted += `Meeting Type: ${firstChunk.metadata.meetingType}\n`;
  }
  if (firstChunk.metadata?.date) {
    formatted += `Date: ${firstChunk.metadata.date}\n`;
  }
  
  formatted += '\n--------------------------------\n\n';
  
  for (const chunk of contextChunks) {
    const speaker = chunk.speaker || 'Unknown Speaker';
    const start = chunk.startTime || '00:00:00';
    const end = chunk.endTime || '00:00:00';
    
    const chunkBlock = `Speaker: ${speaker}\n${start}-${end}\nTranscript: ${chunk.text}\n\n--------------------------------\n\n`;
    
    if (formatted.length + chunkBlock.length > config.MAX_CONTEXT_CHARACTERS) {
      console.log('Context size limit reached, trimming remaining chunks.');
      break;
    }
    
    formatted += chunkBlock;
  }
  
  return formatted;
};

module.exports = { formatContext };
