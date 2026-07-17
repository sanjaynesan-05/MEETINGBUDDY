const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String },
  meetingId: { type: String, index: true },
  messages: [messageSchema],
  summary: { type: String },
  messageCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversation', conversationSchema);
