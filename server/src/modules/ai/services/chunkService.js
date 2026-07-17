const chunkConfig = require('../config/chunkConfig');
const { cleanTranscript } = require('../utils/textCleaner');
const {
  countWords,
  splitIntoParagraphs,
  splitIntoSentences,
  extractTimestamp,
  extractSpeaker,
  calculateChunkMetadata
} = require('../utils/chunkHelpers');

const generateChunks = (meetingId, transcript) => {
  console.log('Cleaning transcript...');
  const cleaned = cleanTranscript(transcript);
  
  console.log('Chunking transcript...');
  const paragraphs = splitIntoParagraphs(cleaned);
  
  const chunks = [];
  let currentChunkText = '';
  let currentWordCount = 0;
  let chunkIndex = 1;
  
  let lastSpeaker = null;
  let lastTimestamp = null;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paraWords = countWords(paragraph);
    
    // Extract metadata from this paragraph to keep track of current state
    const speaker = extractSpeaker(paragraph);
    if (speaker) lastSpeaker = speaker;
    
    const timestamp = extractTimestamp(paragraph);
    if (timestamp) lastTimestamp = timestamp;
    
    // If adding this paragraph exceeds target words (or max words)
    // we should create a chunk if it's over MIN_WORDS
    if ((currentWordCount + paraWords > chunkConfig.TARGET_WORDS) && currentWordCount >= chunkConfig.MIN_WORDS) {
      // Save current chunk
      chunks.push(calculateChunkMetadata(
        currentChunkText.trim(),
        chunkIndex++,
        meetingId,
        lastSpeaker,
        lastTimestamp
      ));
      
      // Determine overlap from the currentChunkText
      const chunkParagraphs = splitIntoParagraphs(currentChunkText);
      let overlapText = '';
      let overlapWords = 0;
      
      for (let j = chunkParagraphs.length - 1; j >= 0; j--) {
        const p = chunkParagraphs[j];
        const pWords = countWords(p);
        
        // Add paragraph to overlap if it fits within overlap limit (with small margin)
        if (overlapWords + pWords <= chunkConfig.OVERLAP_WORDS + 20) {
          overlapText = overlapText ? p + '\n\n' + overlapText : p;
          overlapWords += pWords;
        } else {
          // If we haven't added any overlap yet, take sentences from the last paragraph
          if (!overlapText) {
             const sents = splitIntoSentences(p);
             for (let k = sents.length - 1; k >= 0; k--) {
                const s = sents[k];
                const sWords = countWords(s);
                if (overlapWords + sWords <= chunkConfig.OVERLAP_WORDS) {
                    overlapText = overlapText ? s + ' ' + overlapText : s;
                    overlapWords += sWords;
                } else {
                    break;
                }
             }
          }
          break;
        }
      }
      
      currentChunkText = overlapText ? overlapText.trim() + '\n\n' + paragraph : paragraph;
      currentWordCount = countWords(currentChunkText);
    } else {
      currentChunkText = currentChunkText ? currentChunkText + '\n\n' + paragraph : paragraph;
      currentWordCount += paraWords;
    }
    
    if (chunks.length >= chunkConfig.MAX_CHUNKS) {
      break;
    }
  }
  
  // Add the last chunk if it has remaining text
  if (currentChunkText.trim() && chunks.length < chunkConfig.MAX_CHUNKS) {
    chunks.push(calculateChunkMetadata(
      currentChunkText.trim(),
      chunkIndex,
      meetingId,
      lastSpeaker,
      lastTimestamp
    ));
  }
  
  console.log(`Generated ${chunks.length} chunks`);
  console.log('Chunking completed');
  
  return chunks;
};

module.exports = {
  generateChunks
};
