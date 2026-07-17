const { generateEmbedding } = require('./embeddingService');
const { v4: uuidv4 } = require('uuid');

const generateQueryEmbedding = async (question) => {
  console.log('Generating query embedding...');
  // Reuse Step 3 embedding pipeline
  // Construct a chunk structure since generateEmbedding expects { chunkId, meetingId, text, metadata }
  const fakeChunk = {
    chunkId: uuidv4(),
    meetingId: 'query',
    text: question,
    metadata: { isQuery: true }
  };
  
  const result = await generateEmbedding(fakeChunk);
  return result.vector;
};

module.exports = { generateQueryEmbedding };
