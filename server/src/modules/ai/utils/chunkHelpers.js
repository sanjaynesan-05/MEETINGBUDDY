const { v4: uuidv4 } = require('uuid');

const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

const splitIntoParagraphs = (text) => {
  if (!text) return [];
  // Split by one or more blank lines
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
};

const splitIntoSentences = (text) => {
  if (!text) return [];
  // Match sentence boundaries: punctuation followed by space or end of string
  const match = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g);
  return match ? match.map(s => s.trim()).filter(s => s.length > 0) : [text];
};

const extractTimestamp = (text) => {
  // Matches timestamps like 00:02:15, [00:02:15], or 02:15
  const match = text.match(/\b(?:\d{1,2}:)?\d{2}:\d{2}\b/);
  return match ? match[0] : null;
};

const extractSpeaker = (text) => {
  // Remove leading timestamp if it exists to find the speaker more reliably
  const withoutTimestamp = text.replace(/^(?:\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*)/, '');
  
  // Match "Speaker Name:" at the beginning of the text
  const match = withoutTimestamp.match(/^([^:]+):/);
  if (match) {
    return match[1].trim();
  }
  return null;
};

const calculateChunkMetadata = (chunkText, chunkIndex, meetingId, defaultSpeaker = null, defaultStartTime = null) => {
  const extractedSpeaker = extractSpeaker(chunkText);
  const extractedTimestamp = extractTimestamp(chunkText);
  
  return {
    chunkId: uuidv4(),
    meetingId,
    chunkIndex,
    text: chunkText,
    wordCount: countWords(chunkText),
    characterCount: chunkText.length,
    startTime: extractedTimestamp || defaultStartTime,
    endTime: null, 
    speaker: extractedSpeaker || defaultSpeaker,
    createdAt: new Date().toISOString()
  };
};

module.exports = {
  countWords,
  splitIntoParagraphs,
  splitIntoSentences,
  extractTimestamp,
  extractSpeaker,
  calculateChunkMetadata
};
