const { generateEmbedding } = require('../services/embeddingService');

const embedChunk = async (req, res) => {
  try {
    const { chunk } = req.body;
    
    if (!chunk || !chunk.chunkId || !chunk.meetingId || !chunk.text) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Missing required chunk fields (chunkId, meetingId, text)'
      });
    }
    
    const result = await generateEmbedding(chunk);
    
    return res.status(200).json({
      success: true,
      dimension: result.dimension,
      chunkId: result.chunkId,
      vector: result.vector
    });
  } catch (error) {
    console.error('Embedding controller error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during embedding generation'
    });
  }
};

module.exports = {
  embedChunk
};
