const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    originalFileName: {
      type: String,
      required: true,
    },
    storedFileName: {
      type: String,
      required: true,
      unique: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['audio', 'video'],
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['uploading', 'uploaded', 'transcribing', 'completed', 'failed'],
      default: 'uploaded',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transcript: {
      type: String,
      default: '',
    },
    aiAnalysis: {
  overview: {
    type: String,
    default: '',
  },
  summary: {
    type: String,
    default: '',
  },
  summaryPoints: {
    type: [String],
    default: [],
  },
  agenda: {
    type: [String],
    default: [],
  },
  discussionPoints: {
    type: [String],
    default: [],
  },
  decisions: {
    type: [String],
    default: [],
  },
  actionItems: {
  type: [
    {
      task: {
        type: String,
        default: '',
      },
      owner: {
        type: String,
        default: '',
      },
      deadline: {
        type: String,
        default: '',
      },
      priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium',
      },
      status: {
        type: String,
        default: 'Pending',
      },
    },
  ],
  default: [],
},
  risks: {
    type: [String],
    default: [],
  },
  questions: {
    answered: {
      type: [String],
      default: [],
    },
    unanswered: {
      type: [String],
      default: [],
    },
  },
  keywords: {
    type: [String],
    default: [],
  },
  people: {
    type: [String],
    default: [],
  },
  organizations: {
    type: [String],
    default: [],
  },
  technologies: {
    type: [String],
    default: [],
  },
  meetingType: {
    type: String,
    default: '',
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpReason: {
    type: String,
    default: '',
  },
},
    transcriptionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    transcriptionProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    transcriptionCompletedAt: {
      type: Date,
      default: null,
    },
    transcriptionError: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'en',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries by user
meetingSchema.index({ uploadedBy: 1, createdAt: -1 });

// Virtual: formatted file size
meetingSchema.virtual('formattedFileSize').get(function () {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Ensure virtuals are included in JSON output
meetingSchema.set('toJSON', { virtuals: true });
meetingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Meeting', meetingSchema);
