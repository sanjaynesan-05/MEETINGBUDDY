const { qdrantClient } = require('../config/qdrant');
const { ensureCollectionExists, COLLECTION_NAME } = require('./collectionService');
const { validateIndexPayload } = require('../utils/indexValidator');

const indexVectors = async (embeddingObjects) => {
  if (!Array.isArray(embeddingObjects) || embeddingObjects.length === 0) {
    throw new Error('embeddingObjects must be a non-empty array');
  }
  
  await ensureCollectionExists();
  
  console.log(`Validating ${embeddingObjects.length} vectors...`);
  
  const points = embeddingObjects.map(obj => {
    validateIndexPayload(obj);
    
    return {
      id: obj.chunkId,
      vector: obj.vector,
      payload: {
        meetingId: obj.meetingId,
        chunkId: obj.chunkId,
        chunkIndex: obj.chunkIndex || 1,
        speaker: obj.speaker || null,
        startTime: obj.startTime || null,
        endTime: obj.endTime || null,
        meetingType: obj.meetingType || null,
        keywords: obj.keywords || [],
        people: obj.people || [],
        organizations: obj.organizations || [],
        technologies: obj.technologies || [],
        text: obj.text,
        metadata: obj.metadata || {}
      }
    };
  });
  
  console.log('Uploading vectors...');
  
  try {
    // Qdrant Upsert (if point exists, it replaces vector and payload)
    const result = await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points
    });
    
    console.log(`Indexed ${points.length} vectors`);
    console.log('Upload completed');
    
    return {
      success: true,
      indexedCount: points.length,
      result
    };
  } catch (error) {
    console.error('Error during batch upsert:', error);
    throw error;
  }
};

module.exports = {
  indexVectors
};
