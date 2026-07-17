const validateIndexPayload = (embeddingObj) => {
  if (!embeddingObj) throw new Error('Embedding object is missing');
  
  const { chunkId, meetingId, vector, text, metadata } = embeddingObj;
  
  if (!chunkId) throw new Error('chunkId is missing');
  if (!meetingId) throw new Error('meetingId is missing');
  if (!vector || !Array.isArray(vector)) throw new Error('vector is missing or not an array');
  if (!text) throw new Error('text is missing');
  if (!metadata || typeof metadata !== 'object') throw new Error('metadata must be an object');
  
  return true;
};

module.exports = {
  validateIndexPayload
};
