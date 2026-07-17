const { qdrantClient } = require('../config/qdrant');
const config = require('../config/embeddingConfig');

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'meeting_chunks';
const VECTOR_DIMENSION = config.EMBEDDING_DIMENSION || 768;
const DISTANCE_METRIC = 'Cosine';

const ensureCollectionExists = async () => {
  try {
    console.log('Checking collection...');
    
    // Check if collection exists
    const response = await qdrantClient.getCollections();
    const exists = response.collections.some(c => c.name === COLLECTION_NAME);
    
    if (exists) {
      console.log('Collection exists');
      return true;
    }
    
    console.log('Creating collection...');
    // Create collection
    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_DIMENSION,
        distance: DISTANCE_METRIC
      }
    });
    
    // Create payload index for meetingId to optimize filtering
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'meetingId',
      field_schema: 'keyword',
    });
    
    console.log('Collection created successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring collection exists:', error);
    throw error;
  }
};

const getCollectionStatus = async () => {
  try {
    await ensureCollectionExists();
    
    const collectionInfo = await qdrantClient.getCollection(COLLECTION_NAME);
    
    return {
      success: true,
      collection: COLLECTION_NAME,
      dimension: VECTOR_DIMENSION,
      indexedPoints: collectionInfo.vectors_count || collectionInfo.points_count || 0,
      distance: DISTANCE_METRIC,
      status: 'healthy'
    };
  } catch (error) {
    console.error('Error getting collection status:', error);
    throw error;
  }
};

module.exports = {
  ensureCollectionExists,
  getCollectionStatus,
  COLLECTION_NAME
};
