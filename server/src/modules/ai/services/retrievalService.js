const { qdrantClient } = require('../config/qdrant');
const config = require('../config/retrievalConfig');

const searchQdrant = async (queryVector, filters = {}) => {
  console.log('Searching Qdrant...');
  
  // Build Qdrant filter object dynamically
  const mustConditions = [];
  
  if (filters.meetingId) {
    mustConditions.push({ key: 'meetingId', match: { value: filters.meetingId } });
  }
  if (filters.meetingType) {
    mustConditions.push({ key: 'meetingType', match: { value: filters.meetingType } });
  }
  if (filters.speaker) {
    mustConditions.push({ key: 'speaker', match: { value: filters.speaker } });
  }
  if (filters.date) {
    mustConditions.push({ key: 'date', match: { value: filters.date } });
  }
  if (filters.keywords && Array.isArray(filters.keywords)) {
    for (const kw of filters.keywords) {
      mustConditions.push({ key: 'keywords', match: { value: kw } });
    }
  }
  
  const searchParams = {
    vector: queryVector,
    limit: config.TOP_K,
    with_payload: true, // Request only the payload context, avoiding expensive vector return
    with_vector: false
  };
  
  if (mustConditions.length > 0) {
    searchParams.filter = { must: mustConditions };
  }
  
  try {
    const searchResults = await qdrantClient.search(config.DEFAULT_COLLECTION, searchParams);
    console.log(`Retrieved ${searchResults.length} chunks`);
    return searchResults;
  } catch (error) {
    console.error('Error searching Qdrant:', error);
    throw error;
  }
};

module.exports = { searchQdrant };
