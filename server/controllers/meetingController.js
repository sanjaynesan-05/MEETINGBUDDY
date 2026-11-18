const path = require('path');
const fs = require('fs');
const Meeting = require('../models/Meeting');
const { getFileType } = require('../middleware/upload');
const jobQueue = require('../services/processing/jobQueue');

// Whisper language codes offered in the UI ('' = auto-detect).
const SUPPORTED_LANGUAGES = ['', 'en', 'ta', 'hi', 'te', 'ml', 'kn', 'bn', 'mr', 'gu', 'ur'];
const normalizeLanguage = (value) => {
  const code = String(value || '').trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code) ? code : null;
};
const embeddingStorage = require('../services/embeddings/embedding.storage');
const qdrantStorage = require('../services/embeddings/qdrantStorage');

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
    const languageHint = normalizeLanguage(req.body.language);
    if (languageHint === null) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: 'Unsupported language code.', code: 'BAD_LANGUAGE' });
    }

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
      languageHint,
    });

    console.log(`Audio uploaded`);
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

    // Transcription, AI analysis and embedding run in the background queue.
    await jobQueue.enqueue(meeting._id, 'full');

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
    }).select('title transcript transcriptSegments transcriptionStatus transcriptionProgress transcriptionError language wordCount duration transcriptionCompletedAt status');

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

// @desc    Get AI analysis for a meeting
// @route   GET /api/meetings/:id/analysis
// @access  Private
const getAnalysis = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    }).select(
      'title status aiAnalysis transcriptionStatus transcriptionCompletedAt'
    );

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
        transcriptionStatus: meeting.transcriptionStatus,
        transcriptionCompletedAt: meeting.transcriptionCompletedAt,
        analysis: meeting.aiAnalysis,
      },
    });
  } catch (error) {
    console.error('Get analysis error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting ID format.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI analysis.',
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

    // Delete chunks from MongoDB
    await embeddingStorage.deleteChunksForMeeting(meeting._id.toString()).catch(() => {});

    // Delete vectors from Qdrant
    await qdrantStorage.deleteChunksForMeeting(meeting._id.toString()).catch(() => {});

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

// @desc    Re-run processing for an existing meeting
// @route   POST /api/meetings/:id/reprocess   body: { mode: 'full' | 'analysis' | 'embeddings' }
// @access  Private (owner only)
const reprocessMeeting = async (req, res) => {
  try {
    const mode = (req.body && req.body.mode) || 'full';
    const hasLanguage = req.body && Object.prototype.hasOwnProperty.call(req.body, 'language');
    const languageHint = hasLanguage ? normalizeLanguage(req.body.language) : undefined;
    if (languageHint === null) {
      return res.status(400).json({ success: false, message: 'Unsupported language code.' });
    }
    if (!['full', 'analysis', 'embeddings'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'mode must be full, analysis or embeddings.' });
    }
    const meeting = await Meeting.findOne({ _id: req.params.id, uploadedBy: req.user._id })
      .select('_id filePath transcript status')
      .lean();
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }
    if (jobQueue.isBusy(meeting._id)) {
      return res.status(409).json({ success: false, message: 'This meeting is already being processed.' });
    }
    if (mode === 'full' && (!meeting.filePath || !fs.existsSync(meeting.filePath))) {
      return res.status(409).json({ success: false, message: 'The original recording is no longer available, so it cannot be re-transcribed.' });
    }
    if (mode !== 'full' && !(meeting.transcript && meeting.transcript.trim())) {
      return res.status(409).json({ success: false, message: 'This meeting has no transcript yet. Use a full re-process.' });
    }

    if (languageHint !== undefined) {
      await Meeting.updateOne({ _id: meeting._id }, { languageHint });
    }
    await jobQueue.enqueue(meeting._id, mode);
    return res.status(202).json({
      success: true,
      message: 'Re-processing started.',
      mode,
      queuePosition: jobQueue.position(meeting._id),
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }
    console.error('Reprocess error:', error);
    return res.status(500).json({ success: false, message: 'Failed to start re-processing.' });
  }
};

module.exports = {
  reprocessMeeting,
  uploadMeeting,
  getAllMeetings,
  getMeeting,
  getTranscript,
  getAnalysis,
  deleteMeeting,
};

