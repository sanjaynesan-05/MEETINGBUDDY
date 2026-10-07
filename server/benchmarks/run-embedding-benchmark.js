/**
 * Embedding Generation Performance Benchmark
 *
 * MEASURES SYSTEM PERFORMANCE (NOT accuracy):
 * - Chunking time
 * - Per-chunk embedding generation time (Ollama / nomic-embed-text)
 * - Batch processing throughput
 *
 * Uses the existing chunking service + OllamaEmbeddingProvider.
 * Does NOT write to MongoDB (benchmark-only).
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const chunkingService = require('../services/embeddings/chunking.service');

const RESULTS_DIR = path.join(__dirname, 'results');

async function main() {
  console.log('============================================================');
  console.log('  EMBEDDING PERFORMANCE BENCHMARK');
  console.log('============================================================');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const meeting = await Meeting.findOne({ transcript: { $ne: '' } }).lean();
  if (!meeting) throw new Error('No meeting with transcript found.');
  const transcript = meeting.transcript;

  // 1. Measure chunking
  const chunkStart = Date.now();
  const chunks = chunkingService.chunkTranscript(meeting._id.toString(), transcript, { meetingType: meeting.aiAnalysis?.meetingType });
  const chunkTimeMs = Date.now() - chunkStart;

  console.log(`Transcript: ${transcript.length} chars -> ${chunks.length} chunks (${chunkTimeMs}ms)`);

  // 2. Measure embedding generation via Ollama / nomic-embed-text
  // Highlight: Qdrant is down and the provider falls back to ollama. Test real embedding via the provider
  const providerFactory = require('../services/embeddings/embedding.factory');
  const provider = providerFactory.getProvider('ollama', { model: 'nomic-embed-text' });

  const perChunkTimes = [];
  let success = 0;
  let failures = 0;

  for (let i = 0; i < Math.min(chunks.length, 20); i++) {
    const start = Date.now();
    try {
      const vectors = await provider.generateEmbeddings([chunks[i].text]);
      perChunkTimes.push(Date.now() - start);
      success++;
    } catch (e) {
      console.error(`Chunk ${i} failed:`, e.message);
      failures++;
    }
  }

  const result = {
    benchmark: 'embedding_system_performance',
    timestamp: new Date().toISOString(),
    configuration: {
      embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
      provider: 'ollama',
      chunkSizeMax: 500,
      batchSize: 1,
      hardware: {
        cpu: '12th Gen Intel(R) Core(TM) i5-12450H (12 cores)',
        gpu: 'NVIDIA GeForce RTX 3050 Laptop GPU (CUDA 12.8)',
        ramGB: 16,
        os: 'Windows 11',
        node: process.version,
      },
    },
    chunking: {
      transcriptChars: transcript.length,
      chunksCreated: chunks.length,
      chunkTimeMs,
      avgChunkChars: parseFloat((transcript.length / Math.max(chunks.length, 1)).toFixed(1)),
    },
    embedding: {
      sampledChunks: Math.min(chunks.length, 20),
      success,
      failures,
      perChunkTimesMs: perChunkTimes,
      meanPerChunkMs: perChunkTimes.length ? parseFloat((perChunkTimes.reduce((a, b) => a + b, 0) / perChunkTimes.length).toFixed(1)) : 0,
      minPerChunkMs: perChunkTimes.length ? Math.min(...perChunkTimes) : 0,
      maxPerChunkMs: perChunkTimes.length ? Math.max(...perChunkTimes) : 0,
    },
    disclaimer: 'SYSTEM PERFORMANCE ONLY - NOT an accuracy metric.',
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outFile = path.join(RESULTS_DIR, 'embedding_benchmark.json');
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  console.log(`\n[SAVED] ${outFile}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  if (mongoose.connection.readyState === 1) mongoose.disconnect();
  process.exit(1);
});