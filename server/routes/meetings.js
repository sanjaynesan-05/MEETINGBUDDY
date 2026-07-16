const express = require('express');
const auth = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadMeeting,
  getAllMeetings,
  getMeeting,
  getTranscript,
  deleteMeeting,
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

// @route   DELETE /api/meetings/:id
// @desc    Delete a meeting
router.delete('/:id', deleteMeeting);

module.exports = router;
