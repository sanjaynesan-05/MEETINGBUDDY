const { qdrantClient, QDRANT_ENABLED, checkQdrantHealth } = require('../config/qdrant');

const getHealth = async (req, res) => {
  if (!QDRANT_ENABLED || !qdrantClient) {
    return res.status(200).json({
      success: true,
      status: 'disabled',
      message: 'Qdrant is disabled via configuration.',
    });
  }

  try {
    const health = await checkQdrantHealth();

    if (!health.available) {
      console.warn('[Qdrant] Health check failed:', health.reason);
      return res.status(200).json({
        success: true,
        status: 'unavailable',
        reason: health.reason,
        message: 'Qdrant is not reachable. Vector search is disabled; keyword and MongoDB fallback remain active.',
      });
    }

    console.log('✓ Connected to Qdrant');
    return res.status(200).json({
      success: true,
      status: 'connected',
      collections: health.collections || [],
    });
  } catch (error) {
    console.error('✗ Qdrant connection failed:', error.message);
    return res.status(200).json({
      success: true,
      status: 'error',
      reason: error.message || 'Failed to connect to Qdrant',
      message: 'Qdrant is unavailable. RAG will use MongoDB fallback.',
    });
  }
};

module.exports = {
  getHealth
};
