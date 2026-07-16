const path = require('path');
const fs = require('fs');
const Meeting = require('../models/Meeting');
const { getFileType } = require('../middleware/upload');
const { transcribeFile } = require('../services/transcriptionService');

// @desc    Upload a meeting recording and begin transcription
// @route   POST /api/meetings/upload
// @access  Private
const uploadMeeting = async (req, res) => {
  try {
    // Check file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an audio or video file.',
        code: 'NO_FILE',
      });
    }

    const { title, description } = req.body;

    if (!title || !title.trim()) {
      // Clean up uploaded file if title missing
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: 'Meeting title is required.',
        code: 'TITLE_REQUIRED',
      });
    }

    // Create meeting document
    const meeting = await Meeting.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: req.file.path,
      fileType: getFileType(req.file.mimetype),
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: 'uploaded',
      transcriptionStatus: 'pending',
      uploadedBy: req.user._id,
    });

    // Return immediately — transcription happens asynchronously
    res.status(201).json({
      success: true,
      message: 'Meeting uploaded successfully. Transcription will begin shortly.',
      meeting: {
        id: meeting._id,
        title: meeting.title,
        status: meeting.status,
        transcriptionStatus: meeting.transcriptionStatus,
        fileType: meeting.fileType,
        fileSize: meeting.fileSize,
        formattedFileSize: meeting.formattedFileSize,
        createdAt: meeting.createdAt,
      },
    });

    // Begin transcription asynchronously (non-blocking)
    processTranscription(meeting._id, req.file.path);

  } catch (error) {
    console.error('Upload error:', error);

    // Clean up file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload meeting. Please try again.',
    });
  }
};

// Async transcription processor (runs in background after response is sent)
const processTranscription = async (meetingId, filePath) => {
  try {
    // Update status to transcribing
    await Meeting.findByIdAndUpdate(meetingId, {
      status: 'transcribing',
      transcriptionStatus: 'processing',
    });

    console.log(`🎙️ Starting transcription for meeting: ${meetingId}`);

    // Call Whisper
    let lastProgressTime = 0;
    const result = await transcribeFile(filePath, {}, async (progress) => {
      // Throttle DB updates to once every 2 seconds to avoid slamming MongoDB
      const now = Date.now();
      if (now - lastProgressTime > 2000 || progress === 100) {
        lastProgressTime = now;
        await Meeting.findByIdAndUpdate(meetingId, {
          transcriptionProgress: progress
        }).catch(err => console.error('Failed to update progress in DB:', err));
      }
    });

    // Update meeting with transcript
    await Meeting.findByIdAndUpdate(meetingId, {
      transcript: result.text,
      language: result.language,
      duration: result.duration,
      wordCount: result.wordCount,
      status: 'completed',
      transcriptionStatus: 'completed',
      transcriptionCompletedAt: new Date(),
      transcriptionError: '',
    });

    console.log(`✅ Transcription completed for meeting: ${meetingId}`);

  } catch (error) {
    console.error(`❌ Transcription failed for meeting ${meetingId}:`, error.message);

    await Meeting.findByIdAndUpdate(meetingId, {
      status: 'failed',
      transcriptionStatus: 'failed',
      transcriptionError: error.message,
    });
  }
};

// @desc    Get all meetings for the authenticated user
// @route   GET /api/meetings
// @access  Private
const getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ uploadedBy: req.user._id })
      .select('-transcript') // Exclude full transcript from list view
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve meetings.',
    });
  }
};

// @desc    Get a single meeting by ID
// @route   GET /api/meetings/:id
// @access  Private
const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    res.status(200).json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('Get meeting error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting ID format.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve meeting.',
    });
  }
};

// @desc    Get transcript for a meeting
// @route   GET /api/meetings/:id/transcript
// @access  Private
const getTranscript = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    }).select('title transcript transcriptionStatus transcriptionProgress transcriptionError language wordCount duration transcriptionCompletedAt status');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        meetingId: meeting._id,
        title: meeting.title,
        status: meeting.status,
        transcript: meeting.transcript,
        transcriptionStatus: meeting.transcriptionStatus,
        transcriptionProgress: meeting.transcriptionProgress,
        transcriptionError: meeting.transcriptionError,
        language: meeting.language,
        wordCount: meeting.wordCount,
        duration: meeting.duration,
        transcriptionCompletedAt: meeting.transcriptionCompletedAt,
      },
    });
  } catch (error) {
    console.error('Get transcript error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting ID format.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transcript.',
    });
  }
};

// @desc    Delete a meeting and its uploaded file
// @route   DELETE /api/meetings/:id
// @access  Private
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    // Delete the uploaded file from disk
    if (meeting.filePath && fs.existsSync(meeting.filePath)) {
      fs.unlinkSync(meeting.filePath);
      console.log(`🗑️ Deleted file: ${meeting.filePath}`);
    }

    // Delete from database
    await Meeting.findByIdAndDelete(meeting._id);

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully.',
    });
  } catch (error) {
    console.error('Delete meeting error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting ID format.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete meeting.',
    });
  }
};

module.exports = {
  uploadMeeting,
  getAllMeetings,
  getMeeting,
  getTranscript,
  deleteMeeting,
};
