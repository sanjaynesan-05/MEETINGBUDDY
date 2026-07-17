const config = require('../config/generationConfig');

const formatOutput = (answer, citations, confidence, metadataOverrides = {}) => {
  console.log('Formatting output...');
  
  const response = {
    success: true,
    answer: answer
  };
  
  if (config.ENABLE_CITATIONS) {
    response.citations = citations || [];
  }
  
  if (config.ENABLE_CONFIDENCE) {
    response.confidence = confidence || 0.0;
  }
  
  if (config.ENABLE_METADATA) {
    response.metadata = {
      model: config.OLLAMA_MODEL,
      responseTime: metadataOverrides.responseTime || 0,
      tokenEstimate: metadataOverrides.tokenEstimate || 0,
      chunkCount: metadataOverrides.chunkCount || (citations ? citations.length : 0),
      timestamp: new Date().toISOString()
    };
  }
  
  console.log('Generation complete.');
  return response;
};

module.exports = { formatOutput };
