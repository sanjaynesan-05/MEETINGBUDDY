const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  'audio/mpeg': 'audio',        // .mp3
  'audio/wav': 'audio',         // .wav
  'audio/wave': 'audio',        // .wav (alternative)
  'audio/x-wav': 'audio',       // .wav (alternative)
  'audio/x-m4a': 'audio',       // .m4a
  'audio/mp4': 'audio',         // .m4a
  'audio/aac': 'audio',         // .aac
  'audio/webm': 'audio',        // .webm audio
  'video/mp4': 'video',         // .mp4
  'video/quicktime': 'video',   // .mov
  'video/webm': 'video',        // .webm
  'video/x-msvideo': 'video',   // .avi
};

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4', '.mov', '.webm', '.aac', '.avi'];

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter — validate type and extension
const fileFilter = function (req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = ALLOWED_MIME_TYPES[file.mimetype];
  const isValidExt = ALLOWED_EXTENSIONS.includes(ext);

  if (isValidMime && isValidExt) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}. Received: ${ext} (${file.mimetype})`
    );
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Max file size from env (default: 100MB)
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 104857600;

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
});

// Error handling middleware for Multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMB = Math.round(maxFileSize / (1024 * 1024));
      return res.status(400).json({
        success: false,
        message: `File is too large. Maximum size is ${maxMB} MB.`,
        code: 'FILE_TOO_LARGE',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "file" as the field name.',
        code: 'UNEXPECTED_FIELD',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
      code: err.code,
    });
  }

  if (err && err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'INVALID_FILE_TYPE',
    });
  }

  if (err) {
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during file upload.',
    });
  }

  next();
};

// Helper: determine file type from MIME
const getFileType = (mimeType) => {
  return ALLOWED_MIME_TYPES[mimeType] || 'audio';
};

module.exports = {
  upload,
  handleUploadError,
  getFileType,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
};
