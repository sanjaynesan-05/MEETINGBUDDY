const mongoose = require('mongoose');

const meetingChunkSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    chunkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    chunkVersion: {
      type: Number,
      default: 1,
    },
    contentHash: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    chunkType: {
      type: String,
      enum: ['Transcript', 'Summary', 'Decision', 'Action Item', 'Discussion'],
      default: 'Transcript',
    },
    embedding: {
      vector: {
        type: [Number],
        required: true,
      },
      model: {
        type: String,
        required: true,
      },
      provider: {
        type: String,
        required: true,
      },
      dimensions: {
        type: Number,
        required: true,
      },
      generatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    metadata: {
      speaker: {
        type: String,
        default: null,
      },
      startTime: {
        type: Number,
        default: null,
      },
      endTime: {
        type: Number,
        default: null,
      },
      tokenEstimate: {
        type: Number,
        required: true,
      },
      meetingType: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient index-based retrieval per meeting
meetingChunkSchema.index({ meetingId: 1, chunkIndex: 1 });

module.exports = mongoose.model('MeetingChunk', meetingChunkSchema);
