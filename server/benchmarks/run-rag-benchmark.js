/**
 * RAG Performance Benchmark
 *
 * Measures SYSTEM-LEVEL metrics (NOT answer accuracy):
 * - retrieval latency
 * - generation latency
 * - end-to-end latency
 * - number of retrieved chunks
 * - context size (characters)
 * - retrieval score distribution (if meaningful)
 *
 * Uses the actual production ragChat.service with a real question.
 *
 * IMPORTANT: No ground-truth QA labels exist, so answer accuracy is
 * NOT measured. The benchmark reports system-level latency only.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const ragRetrieval = require('../services/ai/ragRetrieval.service');
const Meeting = require('../models/Meeting');

const RESULTS_DIR = path.join(__dirname, 'results');
const RUNS = parseInt(process.env.RAG_BENCH_RUNS || '3', 10);

const QUESTIONS = [
  'What was decided about the cloud provider?',
  'Who owns the security review actions?',
  'What was discussed about car parking?',
  'What are the main risks discussed?',
  'How many people attended?',
];

async function main() {
  console.log('============================================================');
  console.log('  RAG PERFORMANCE BENCHMARK');
  console.log('============================================================');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const meeting = await Meeting.findOne({ status: 'completed' }).lean();
  if (!meeting) throw new Error('No completed meeting found.');
  const userId = meeting.uploadedBy.toString();

  const results = {
    benchmark: 'rag_system_performance',
    timestamp: new Date().toISOString(),
    configuration: {
      model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      temperature: process.env.GENERATION_TEMPERATURE || '0.3',
      retrievalTopK: process.env.RETRIEVAL_TOP_K || '10',
      maxContextChars: process.env.RETRIEVAL_MAX_CONTEXT_CHARACTERS || '10000',
      hardware: {
        cpu: '12th Gen Intel(R) Core(TM) i5-12450H (12 cores)',
        gpu: 'NVIDIA GeForce RTX 3050 Laptop GPU (CUDA 12.8)',
        ramGB: 16,
        os: 'Windows 11',
        node: process.version,
      },
    },
    questions: [],
    aggregate: {},
  };

  const ragChat = require('../services/ai/ragChat.service');

  for (const question of QUESTIONS) {
    const questionResults = {
      question,
      runs: [],
    };

    for (let r = 1; r <= RUNS; r++) {
      console.log(`\n--- Question: "${question}" (run ${r}/${RUNS}) ---`);

      // Measure retrieval-only latency
      const retStart = Date.now();
      const { chunks, totalChars, source } = await ragRetrieval.retrieveForChat({
        question,
        meetingId: 'all',
        userId,
      });
      const retrievalTimeMs = Date.now() - retStart;

      // Measure end-to-end RAG chat latency
      const chatStart = Date.now();
      const chatResult = await ragChat.chat({
        question,
        meetingId: 'all',
        userId,
        conversationHistory: [],
      });
      const endToEndMs = Date.now() - chatStart;

      questionResults.runs.push({
        run: r,
        retrievalTimeMs,
        generationTimeMs: endToEndMs - retrievalTimeMs,
        endToEndMs,
        chunksRetrieved: chunks.length,
        contextChars: totalChars,
        retrievalSource: source,
        responseTimeMetadata: chatResult.metadata?.responseTime || 0,
        answerLength: (chatResult.answer || '').length,
      });

      console.log(`  Retrieval: ${retrievalTimeMs}ms, Chunks: ${chunks.length}, Source: ${source}`);
      console.log(`  End-to-end: ${endToEndMs}ms, Answer: ${(chatResult.answer || '').substring(0, 80)}...`);
    }

    results.questions.push(questionResults);
  }

  // Compute aggregates
  const allRetrievalMsArr = [];
  const allEndToEndMsArr = [];
  const allChunksArr = [];

  for (const q of results.questions) {
    for (const run of q.runs) {
      allRetrievalMsArr.push(run.retrievalTimeMs);
      allEndToEndMsArr.push(run.endToEndMs);
      allChunksArr.push(run.chunksRetrieved);
    }
  }

  results.aggregate = {
    retrievalMs: {
      n: allRetrievalMsArr.length,
      mean: allRetrievalMsArr.length ? parseFloat((allRetrievalMsArr.reduce((a, b) => a + b, 0) / allRetrievalMsArr.length).toFixed(1)) : 0,
      min: allRetrievalMsArr.length ? Math.min(...allRetrievalMsArr) : 0,
      max: allRetrievalMsArr.length ? Math.max(...allRetrievalMsArr) : 0,
    },
    endToEndMs: {
      n: allEndToEndMsArr.length,
      mean: allEndToEndMsArr.length ? parseFloat((allEndToEndMsArr.reduce((a, b) => a + b, 0) / allEndToEndMsArr.length).toFixed(1)) : 0,
      min: allEndToEndMsArr.length ? Math.min(...allEndToEndMsArr) : 0,
      max: allEndToEndMsArr.length ? Math.max(...allEndToEndMsArr) : 0,
    },
    chunksRetrieved: {
      n: allChunksArr.length,
      mean: allChunksArr.length ? parseFloat((allChunksArr.reduce((a, b) => a + b, 0) / allChunksArr.length).toFixed(1)) : 0,
    },
    disclaimer: 'System-level latency metrics only. Answer accuracy is NOT measured (no ground-truth QA labels exist).',
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outFile = path.join(RESULTS_DIR, 'rag_benchmark.json');
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log('\n==== AGGREGATES ====');
  console.log(JSON.stringify(results.aggregate, null, 2));
  console.log(`\n[SAVED] ${outFile}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  if (mongoose.connection.readyState === 1) mongoose.disconnect();
  process.exit(1);
});