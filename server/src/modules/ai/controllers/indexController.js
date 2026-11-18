const { indexVectors } = require('../services/indexService');
const { getCollectionStatus, COLLECTION_NAME } = require('../services/collectionService');
const { qdrantClient } = require('../config/qdrant');
const { getOwnedMeetingIds } = require('../../../../services/search/meetingAccess');

const getExistingPoints = async (ids) => {
  const valid = ids.filter((id) => id !== undefined && id !== null);
  if (!qdrantClient || valid.length === 0) return [];
  try {
    return await qdrantClient.retrieve(COLLECTION_NAME, { ids: valid, with_payload: true, with_vector: false });
  } catch (err) {
    // Collection may not exist yet — nothing to overwrite.
    return [];
  }
};

const indexEmbeddings = async (req, res) => {
  try {
    const { chunks } = req.body;
    
    if (!chunks || !Array.isArray(chunks)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Expected a "chunks" array.'
      });
    }
    
    // Users may only index vectors into meetings they own, and may not
    // overwrite existing points that belong to someone else's meeting.
    const owned = new Set(await getOwnedMeetingIds(req.user._id));
    const foreign = chunks.find((c) => !c || !owned.has(String(c.meetingId)));
    if (foreign) {
      return res.status(403).json({
        success: false,
        error: 'You can only index chunks for your own meetings.'
      });
    }
    const existing = await getExistingPoints(chunks.map((c) => c.chunkId));
    if (existing.some((p) => !owned.has(String(p.payload && p.payload.meetingId)))) {
      return res.status(403).json({
        success: false,
        error: 'One or more chunk IDs belong to another meeting.'
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
