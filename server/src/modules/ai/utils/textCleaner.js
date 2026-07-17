/**
 * Cleans the raw transcript text.
 * - Normalizes whitespace and line endings
 * - Removes duplicate blank lines
 * - Preserves timestamps and speaker names
 */
const cleanTranscript = (transcript) => {
  if (!transcript || typeof transcript !== 'string') return '';
  
  // Normalize line endings to \n
  let cleaned = transcript.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove duplicate blank lines (more than 2 consecutive newlines become 2 newlines)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Normalize spaces (convert tabs to spaces, remove multiple spaces, but don't touch newlines)
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  
  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
};

module.exports = {
  cleanTranscript
};
