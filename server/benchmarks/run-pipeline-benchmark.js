/**
 * Pipeline Performance Benchmark
 *
 * Measures system-level performance metrics (NOT accuracy):
 * - Audio duration from stored meeting data
 * - Transcription time (from stored transcript processing records)
 * - Diarization time (if available)
 * - Embedding generation time
 * - Indexing time
 * - Retrieval latency (keyword)
 * - RAG response time (end-to-end)
 *
 * Only reports what is MEASURABLE. Metrics that cannot be measured are
 * reported as NOT_MEASURED.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const searchService = require('../services/search/search.service');
const Meeting = require('../models/Meeting');
const MeetingChunk = require('../models/MeetingChunk');

const RESULTS_DIR = path.join(__dirname, 'results');

async function main() {
  console.log('============================================================');
  console.log('  PIPELINE PERFORMANCE BENCHMARK');
  console.log('============================================================');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const MeetingModel = mongoose.model('Meeting');
  const MeetingChunkModel = mongoose.model('MeetingChunk');

  const meetings = await MeetingModel.find({}).lean();
  const completedMeetings = meetings.filter(m => m.status === 'completed');

  const result = {
    benchmark: 'pipeline_performance',
    timestamp: new Date().toISOString(),
    hardware: {
      cpu: '12th Gen Intel(R) Core(TM) i5-12450H (12 cores)',
      gpu: 'NVIDIA GeForce RTX 3050 Laptop GPU (CUDA 12.8)',
      ramGB: 16,
      os: 'Windows 11',
      node: process.version,
    },
    availableData: {
      meetings: meetings.length,
      completedMeetings: completedMeetings.length,
    },
    metrics: {},
  };

  // A. Audio duration (from stored data)
  const durations = completedMeetings.map(m => m.duration);
  result.metrics.audioDuration = {
    status: 'MEASURED',
    source: 'Meeting.duration (from transcription output)',
    values_seconds: durations,
    mean_s: durations.length ? parseFloat((durations.reduce((a,b)=>a+b,0)/durations.length).toFixed(2)) : 0,
    min_s: durations.length ? Math.min(...durations) : 0,
    max_s: durations.length ? Math.max(...durations) : 0,
  };

  // B. Transcription time: NOT directly recorded in DB (only completedAt date)
  result.metrics.transcriptionTime = {
    status: 'NOT_MEASURED',
    reason: 'transcriptionCompletedAt timestamps stored, but processing start time not stored in DB.',
    actualTickData: completedMeetings.map(m => ({
      title: m.title,
      transcriptionCompletedAt: m.transcriptionCompletedAt ? m.transcriptionCompletedAt.toISOString() : null,
      createdAt: m.createdAt ? m.createdAt.toISOString() : null,
    })),
  };

  // C. Diarization time: NOT recorded
  const withSpeakerLabels = completedMeetings.filter(m => (m.transcriptSegments || []).some(s => s.speaker && s.speaker !== 'Unknown'));
  result.metrics.diarization = {
    status: 'NOT_MEASURED',
    reason: 'Diarization time is not recorded as a separate stage in stored data.',
    meetingsWithSpeakers: withSpeakerLabels.length,
  };

  // D-G. LLM extraction times: existing metrics from processing logs, not persisted
  result.metrics.llmExtractionTimes = {
    status: 'NOT_MEASURED_FROM_STORED_DATA',
    reason: 'meeting.processor.js logs stage timings to console but does not persist them. Run run-extraction-benchmark.js for live measurements.',
  };

  // K-L. Embedding generation & indexing: measure from stored chunk data
  const chunkCount = await MeetingChunkModel.countDocuments();
  result.metrics.embeddingChunks = {
    status: 'MEASURED',
    totalChunks: chunkCount,
    perMeeting: await Promise.all(completedMeetings.map(async m => {
      const c = await MeetingChunkModel.countDocuments({ meetingId: m._id });
      return { title: m.title, meetingId: m._id.toString(), chunks: c };
    })),
    embeddingModel: 'nomic-embed-text (768-dim, ollama)',
    note: 'Generation time per chunk was logged at processing time but not persisted. Re-run embedding benchmark for live timing.',
  };

  // M. Retrieval latency: measure keyword search latency on real queries
  const userId = completedMeetings[0]?.uploadedBy?.toString();
  if (userId) {
    const queries = ['deploy', 'security', 'meeting', 'project', 'decision'];
    const retrievalTimings = [];
    for (const q of queries) {
      const start = Date.now();
      try {
        const res = await searchService.search(userId, { q, limit: 5 });
        const elapsed = Date.now() - start;
        retrievalTimings.push({
          query: q,
          executionTimeMs: elapsed,
          returned: res.stats.returned,
          total: res.stats.searchedMeetings,
        });
      } catch (e) {
        retrievalTimings.push({ query: q, error: e.message });
      }
    }
    result.metrics.retrievalLatency = {
      status: 'MEASURED',
      type: 'keyword_search',
      runs: retrievalTimings,
      note: 'Latency includes Mongo aggregation + snippet generation.',
    };
  } else {
    result.metrics.retrievalLatency = { status: 'NOT_MEASURED', reason: 'No completed meetings found.' };
  }

  // N. RAG generation time: requires live Ollama call
  result.metrics.ragGenerationTime = {
    status: 'NOT_MEASURED_IN_THIS_RUN',
    reason: 'Requires live Ollama call with RAG pipeline. Use run-rag-benchmark.js for live measurement.',
  };

  // O. End-to-end: computed only from sequential stages in DB where possible
  result.metrics.endToEnd = {
    status: 'PARTIALLY_MEASURED',
    note: 'Completion status available, but per-stage timestamps not persisted.',
    completedMeetings: completedMeetings.length,
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outFile = path.join(RESULTS_DIR, 'pipeline_metrics.json');
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  console.log(`\n[SAVED] ${outFile}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  if (mongoose.connection.readyState === 1) mongoose.disconnect();
  process.exit(1);
});