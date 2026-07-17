const { qdrantClient } = require('../config/qdrant');

const getHealth = async (req, res) => {
  try {
    const response = await qdrantClient.getCollections();
    
    console.log('✓ Connected to Qdrant');
    
    return res.status(200).json({
      success: true,
      status: 'connected',
      collections: response.collections || []
    });
  } catch (error) {
    console.error('✗ Qdrant connection failed:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to Qdrant'
    });
  }
};

module.exports = {
  getHealth
};
