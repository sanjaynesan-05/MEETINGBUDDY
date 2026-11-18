const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadMeeting,
  getAllMeetings,
  getMeeting,
  getTranscript,
  getAnalysis,
  deleteMeeting,
  reprocessMeeting,
} = require('../controllers/meetingController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/meetings/upload
// @desc    Upload a meeting recording
router.post(
  '/upload',
  upload.single('file'),
  handleUploadError,
  uploadMeeting
);

// @route   GET /api/meetings
// @desc    Get all meetings for the authenticated user
router.get('/', getAllMeetings);

// @route   GET /api/meetings/:id
// @desc    Get a single meeting by ID
router.get('/:id', getMeeting);

// @route   GET /api/meetings/:id/transcript
// @desc    Get transcript for a meeting
router.get('/:id/transcript', getTranscript);

// @route   GET /api/meetings/:id/analysis
// @desc    Get AI analysis for a meeting
// @access  Private
router.get('/:id/analysis', getAnalysis);

// @route   GET /api/meetings/:id/media
// @desc    Stream the original recording — owner only (replaces public /uploads)
router.get('/:id/media', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }
    const meeting = await Meeting.findOne({ _id: req.params.id, uploadedBy: req.user._id })
      .select('filePath mimeType originalFileName')
      .lean();
    if (!meeting || !meeting.filePath) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    // Defence in depth: only ever serve files from inside the uploads directory.
    const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    const filePath = path.resolve(meeting.filePath);
    if (!filePath.startsWith(uploadDir + path.sep) || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Recording not available.' });
    }

    res.type(meeting.mimeType || 'application/octet-stream');
    res.set('Cache-Control', 'private, no-store');
    return res.sendFile(filePath); // supports HTTP Range for audio/video seeking
  } catch (error) {
    console.error('Media fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load recording.' });
  }
});

// @route   POST /api/meetings/:id/reprocess
// @desc    Re-run transcription / AI analysis / embeddings for a meeting
router.post('/:id/reprocess', reprocessMeeting);

// @route   DELETE /api/meetings/:id
// @desc    Delete a meeting
router.delete('/:id', deleteMeeting);

module.exports = router;
