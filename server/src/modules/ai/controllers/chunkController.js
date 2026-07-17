const { generateChunks } = require('../services/chunkService');

const chunkTranscript = async (req, res) => {
  try {
    const { meetingId, transcript } = req.body;
    
    if (!meetingId || !transcript) {
      return res.status(400).json({
        success: false,
        error: 'Missing meetingId or transcript'
      });
    }
    
    if (typeof transcript !== 'string' || transcript.trim().length === 0) {
       return res.status(400).json({
        success: false,
        error: 'Empty or invalid transcript'
      });
    }
    
    const chunks = generateChunks(meetingId, transcript);
    
    return res.status(200).json({
      success: true,
      totalChunks: chunks.length,
      chunks
    });
  } catch (error) {
    console.error('Error generating chunks:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during chunking'
    });
  }
};

module.exports = {
  chunkTranscript
};
