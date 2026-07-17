const { indexVectors } = require('../services/indexService');
const { getCollectionStatus } = require('../services/collectionService');

const indexEmbeddings = async (req, res) => {
  try {
    const { chunks } = req.body;
    
    if (!chunks || !Array.isArray(chunks)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Expected a "chunks" array.'
      });
    }
    
    const result = await indexVectors(chunks);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Index controller error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during indexing'
    });
  }
};

const getStatus = async (req, res) => {
  try {
    const status = await getCollectionStatus();
    return res.status(200).json(status);
  } catch (error) {
    console.error('Status controller error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching status'
    });
  }
};

module.exports = {
  indexEmbeddings,
  getStatus
};
