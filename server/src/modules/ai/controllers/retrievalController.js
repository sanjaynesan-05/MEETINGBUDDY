const { validateRetrievalRequest } = require('../utils/retrievalValidator');
const { generateQueryEmbedding } = require('../services/queryEmbeddingService');
const { searchQdrant } = require('../services/retrievalService');
const { rankResults } = require('../services/rankingService');
const { buildContext } = require('../services/contextBuilderService');
const config = require('../config/retrievalConfig');

const retrieveContext = async (req, res) => {
  try {
    const { question, filters } = req.body;
    
    validateRetrievalRequest(question, filters);
    
    const queryVector = await generateQueryEmbedding(question);
    
    const rawResults = await searchQdrant(queryVector, filters || {});
    
    const rankedResults = rankResults(rawResults);
    
    const context = buildContext(rankedResults);
    
    console.log('Retrieval completed');
    
    return res.status(200).json({
      success: true,
      totalResults: context.length,
      context
    });
  } catch (error) {
    console.error('Error during retrieval:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during retrieval'
    });
  }
};

const getHealth = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      collection: config.DEFAULT_COLLECTION,
      status: 'healthy',
      retrieverReady: true
    });
  } catch (error) {
    console.error('Status controller error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check retriever health'
    });
  }
};

module.exports = { retrieveContext, getHealth };
