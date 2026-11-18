/**
 * RAG Performance Benchmark v2 – Item 3
 *
 * What is new vs the original run-rag-benchmark.js
 * -------------------------------------------------
 *  1. Checks whether Qdrant is reachable; prints the Docker startup command
 *     if it is not, and waits for the user to start it (or falls back to
 *     mongodb_fallback mode and marks results accordingly).
 *  2. Splits retrieval timing into:
 *       a) queryEmbeddingMs  – time to embed the question via Ollama
 *       b) qdrantSearchMs    – time for the actual Qdrant ANN search
 *       c) totalRetrievalMs  – a + b (what the old benchmark measured as one)
 *  3. Runs 3 repetitions per question and reports mean ± std.
 *  4. Writes results/rag_benchmark_v2.json.
 *
 * Run: node benchmarks/run-rag-benchmark-v2.js
 *
 * If Qdrant is not running, start it with:
 *   docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
 * Then re-run this script.
 */
'use strict';

const path = require('path');
const fs   = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Meeting  = require('../models/Meeting');
const { OllamaEmbeddingProvider } = require('../services/embeddings/embedding.provider');
const { checkHealth, searchPoints } = require('../services/embeddings/qdrantStorage');
const ragRetrieval = require('../services/ai/ragRetrieval.service');
const ragChat      = require('../services/ai/ragChat.service');

const RESULTS_DIR = path.join(__dirname, 'results');
const RUNS        = parseInt(process.env.RAG_BENCH_RUNS || '3', 10);
const EMBED_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

const QUESTIONS = [
  'What was decided about the cloud provider?',
  'Who owns the security review actions?',
  'What was discussed about car parking?',
  'What are the main risks discussed?',
  'How many people attended?',
];

const mean   = (a) => a.length ? a.reduce((s,v)=>s+v,0)/a.length : 0;
const stddev = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1));
};
const fmt = (v) => parseFloat(v.toFixed(1));

async function embedQuery(provider, question) {
  const t0 = Date.now();
  const results = await provider.generateEmbeddings([question]);
  return { vector: results[0].vector, ms: Date.now() - t0 };
}

async function qdrantSearch(vector, limit = 10) {
  const t0 = Date.now();
  const hits = await searchPoints(vector, {}, limit);
  return { hits: hits || [], ms: Date.now() - t0 };
}

async function main() {
  console.log('============================================================');
  console.log('  RAG PERFORMANCE BENCHMARK v2');
  console.log('  (Splits query-embedding vs Qdrant search timing)');
  console.log('============================================================');

  // 1. Check Qdrant
  console.log('\n[Step 1] Checking Qdrant...');
  const health = await checkHealth();
  console.log('  Qdrant available:', health.available);
  if (!health.available) {
    console.warn('  Qdrant is NOT running. Retrieval will use mongodb_fallback.');
    console.warn('  To start Qdrant:');
    console.warn('    docker run -d --name qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant');
    console.warn('  Then rerun this script.');
    console.warn('  Continuing with mongodb_fallback...\n');
  } else {
    console.log('  Collection:', health.collection, '  exists:', health.collectionExists);
    console.log('  Dimension:', health.vectorDimension);
  }

  // 2. Connect MongoDB
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const meeting = await Meeting.findOne({ status: 'completed' }).lean();
  if (!meeting) throw new Error('No completed meeting found.');
  const userId = meeting.uploadedBy.toString();

  // 3. Warm up the embedding model (first call is slow)
  const embProvider = new OllamaEmbeddingProvider(EMBED_MODEL);
  console.log('\n[Step 2] Warming up embedding model...');
  await embProvider.generateEmbeddings(['warm up']);
  console.log('  Done.');

  const results = {
    benchmark: 'rag_system_performance_v2',
    timestamp: new Date().toISOString(),
    qdrantAvailable: health.available,
    configuration: {
      model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      embeddingModel: EMBED_MODEL,
      temperature: process.env.GENERATION_TEMPERATURE || '0.3',
      retrievalTopK: process.env.RETRIEVAL_TOP_K || '10',
      maxContextChars: process.env.RETRIEVAL_MAX_CONTEXT_CHARACTERS || '10000',
      hardware: {
        cpu: '12th Gen Intel Core i5-12450H (12 cores)',
        gpu: 'NVIDIA RTX 3050 Laptop (CUDA 12.8, 4 GB VRAM)',
        ramGB: 16, os: 'Windows 11', node: process.version,
      },
    },
    questions: [],
    aggregate: {},
  };

  // 4. Per-question × runs
  for (const question of QUESTIONS) {
    const qResult = { question, runs: [] };
    console.log(`\n--- "${question}" ---`);

    for (let r = 1; r <= RUNS; r++) {
      const runData = { run: r };

      // 4a. Query embedding timing
      let embMs = 0;
      let queryVector = null;
      try {
        const emb = await embedQuery(embProvider, question);
        embMs = emb.ms;
        queryVector = emb.vector;
        runData.queryEmbeddingMs = embMs;
      } catch (e) {
        runData.queryEmbeddingMs = null;
        runData.embeddingError = e.message;
      }

      // 4b. Qdrant ANN search timing (only if Qdrant is up AND we have a vector)
      let qdrantMs = null;
      if (health.available && queryVector) {
        try {
          const sr = await qdrantSearch(queryVector, 10);
          qdrantMs = sr.ms;
          runData.qdrantSearchMs = qdrantMs;
          runData.qdrantHits = sr.hits.length;
        } catch (e) {
          runData.qdrantSearchMs = null;
          runData.qdrantError = e.message;
        }
      }

      // 4c. Full retrieval (uses ragRetrieval which tries hybrid → keyword → mongodb)
      const retStart = Date.now();
      let retResult;
      try {
        retResult = await ragRetrieval.retrieveForChat({ question, meetingId: 'all', userId });
      } catch (e) {
        retResult = { chunks: [], totalChars: 0, source: 'error:' + e.message };
      }
      const totalRetrievalMs = Date.now() - retStart;

      runData.totalRetrievalMs = totalRetrievalMs;
      runData.chunksRetrieved  = retResult.chunks.length;
      runData.contextChars     = retResult.totalChars;
      runData.retrievalSource  = retResult.source;

      // 4d. End-to-end RAG (retrieval + generation)
      const chatStart = Date.now();
      let chatResult;
      try {
        chatResult = await ragChat.chat({ question, meetingId: 'all', userId, conversationHistory: [] });
      } catch (e) {
        chatResult = { answer: '', metadata: {} };
      }
      const endToEndMs = Date.now() - chatStart;
      runData.endToEndMs        = endToEndMs;
      runData.generationMs      = endToEndMs - totalRetrievalMs;
      runData.answerLength      = (chatResult.answer || '').length;

      console.log(
        `  Run ${r}: emb=${embMs}ms  qdrant=${qdrantMs === null ? 'N/A' : qdrantMs+'ms'}` +
        `  ret(total)=${totalRetrievalMs}ms  e2e=${endToEndMs}ms  src=${retResult.source}`
      );

      qResult.runs.push(runData);
    }

    results.questions.push(qResult);
  }

  // 5. Aggregate
  const allEmbMs   = [];
  const allQdMs    = [];
  const allRetMs   = [];
  const allE2EMs   = [];

  for (const q of results.questions) {
    for (const r of q.runs) {
      if (r.queryEmbeddingMs != null) allEmbMs.push(r.queryEmbeddingMs);
      if (r.qdrantSearchMs   != null) allQdMs.push(r.qdrantSearchMs);
      allRetMs.push(r.totalRetrievalMs);
      allE2EMs.push(r.endToEndMs);
    }
  }

  const agg = (arr, label) => ({
    label, n: arr.length,
    mean_ms: fmt(mean(arr)),
    std_ms:  fmt(stddev(arr)),
    min_ms:  arr.length ? Math.min(...arr) : null,
    max_ms:  arr.length ? Math.max(...arr) : null,
  });

  results.aggregate = {
    queryEmbeddingMs:  agg(allEmbMs,  'query_embedding_via_ollama'),
    qdrantSearchMs:    agg(allQdMs,   'qdrant_ann_search'),
    totalRetrievalMs:  agg(allRetMs,  'total_retrieval_embedding+search'),
    endToEndMs:        agg(allE2EMs,  'end_to_end_retrieval+generation'),
    qdrantAvailable:   health.available,
    retrievalSourceNote: health.available
      ? 'Qdrant running: hybrid search active'
      : 'Qdrant NOT running: results used mongodb_fallback – start Qdrant and rerun',
  };

  console.log('\n==== AGGREGATES ====');
  console.log(JSON.stringify(results.aggregate, null, 2));

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const out = path.join(RESULTS_DIR, 'rag_benchmark_v2.json');
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\n[SAVED] ${out}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  if (mongoose.connection.readyState === 1) mongoose.disconnect();
  process.exit(1);
});
