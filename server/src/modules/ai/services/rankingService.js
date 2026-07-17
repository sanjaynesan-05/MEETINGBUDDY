const config = require('../config/retrievalConfig');

const rankResults = (rawResults) => {
  if (!rawResults || rawResults.length === 0) return [];
  
  // Apply MIN_SCORE threshold
  let filtered = rawResults.filter(result => result.score >= config.MIN_SCORE);
  
  // Remove empty chunks
  filtered = filtered.filter(result => result.payload && result.payload.text && result.payload.text.trim().length > 0);
  
  // Remove duplicates
  const seenIds = new Set();
  const deduped = [];
  
  for (const result of filtered) {
    const chunkId = result.payload.chunkId || result.id;
    if (!seenIds.has(chunkId)) {
      seenIds.add(chunkId);
      deduped.push(result);
    }
  }
  
  const removedDuplicates = filtered.length - deduped.length;
  console.log(`Removed ${removedDuplicates} duplicates`);
  
  // Sort by highest score first
  deduped.sort((a, b) => b.score - a.score);
  
  return deduped;
};

module.exports = { rankResults };
