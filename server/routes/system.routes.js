const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { checkWhisperAvailability } = require('../services/transcriptionService');
const { checkHealth: checkQdrantHealth, qdrantClient, COLLECTION_NAME } = require('../services/embeddings/qdrantStorage');
const Meeting = require('../models/Meeting');
const MeetingChunk = require('../models/MeetingChunk');

const router = express.Router();
router.use(auth);

const withTimeout = (promise, ms, label) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms))]);

const checkOllama = async () => {
  const base = process.env.OLLAMA_HOST || process.env.OLLAMA_URL || 'http://localhost:11434';
  const llm = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
  const embed = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
  try {
    const r = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return { available: false, message: `Ollama responded ${r.status}` };
    const names = ((await r.json()).models || []).map((m) => m.name);
    const has = (model) => names.some((n) => n === model || n === `${model}:latest` || n.split(':')[0] === model);
    const missing = [llm, embed].filter((m) => !has(m));
    return {
      available: missing.length === 0,
      llmModel: llm,
      embeddingModel: embed,
      message: missing.length ? `Missing model(s): ${missing.join(', ')} — run "ollama pull <model>"` : 'Both models installed',
    };
  } catch (err) {
    return { available: false, llmModel: llm, embeddingModel: embed, message: `Ollama not reachable at ${base}` };
  }
};

const checkQdrant = async () => {
  try {
    const health = await checkQdrantHealth();
    if (!health.available) return { available: false, message: health.reason || 'Qdrant unavailable' };
    let points = null;
    try {
      points = (await qdrantClient.count(COLLECTION_NAME, { exact: true })).count;
    } catch { /* collection may not exist yet */ }
    return { available: true, collection: COLLECTION_NAME, vectors: points, dimension: health.vectorDimension };
  } catch (err) {
    return { available: false, message: err.message };
  }
};

// @route   GET /api/system/status
// @desc    Connectivity of every backing service + the caller's index sync state
router.get('/status', async (req, res) => {
  const [whisper, qdrant, ollama] = await Promise.all([
    withTimeout(checkWhisperAvailability(), 20000, 'Whisper check').catch((e) => ({ available: false, message: e.message })),
    withTimeout(checkQdrant(), 6000, 'Qdrant check').catch((e) => ({ available: false, message: e.message })),
    checkOllama(),
  ]);

  const mongoUp = mongoose.connection.readyState === 1;
  let index = null;
  if (mongoUp) {
    const meetings = await Meeting.find({ uploadedBy: req.user._id }).select('_id embeddingStatus status').lean();
    const ids = meetings.map((m) => m._id);
    index = {
      meetings: meetings.length,
      embedded: meetings.filter((m) => m.embeddingStatus === 'completed').length,
      chunks: await MeetingChunk.countDocuments({ meetingId: { $in: ids } }),
    };
  }

  res.json({
    success: true,
    checkedAt: new Date().toISOString(),
    services: {
      api: { available: true },
      mongodb: { available: mongoUp, message: mongoUp ? 'Connected' : 'Not connected' },
      qdrant,
      ollama,
      whisper,
    },
    index,
  });
});

module.exports = router;
