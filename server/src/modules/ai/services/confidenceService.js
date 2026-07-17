const calculateConfidence = (contextChunks) => {
  console.log('Calculating confidence...');
  
  if (!contextChunks || contextChunks.length === 0) {
    return 0.0;
  }
  
  const totalScore = contextChunks.reduce((acc, curr) => acc + (curr.similarityScore || 0), 0);
  const avgSimilarity = totalScore / contextChunks.length;
  
  const chunkFactor = Math.min(contextChunks.length / 5, 1.0) * 0.1;
  
  let confidence = (avgSimilarity * 0.9) + chunkFactor;
  
  if (confidence > 1.0) confidence = 1.0;
  if (confidence < 0.0) confidence = 0.0;
  
  return Number(confidence.toFixed(2));
};

module.exports = { calculateConfidence };
