/**
 * Extraction Benchmark: Parallel vs Sequential LLM Extraction
 *
 * SAFETY: This benchmark REUSES the existing production extractor services
 * and validator WITHOUT modifying any production file. It is a standalone
 * benchmark-only runner.
 *
 * Benchmark methodology:
 * - Loads N real meeting transcripts (or a synthetic benchmark transcript)
 * - Runs all 9 extraction stages SEQUENTIALLY (one after another)
 * - Runs all 9 extraction stages IN PARALLEL (Promise.all, same as production)
 * - Records per-stage wall-clock inference time
 * - Repeats R times (configurable)
 * - Computes aggregate statistics: mean, median, min, max, stddev
 * - Speedup = sequential_total / parallel_total
 * - Latency reduction % = (seq - par) / seq * 100
 *
 * Model: qwen2.5:7b via Ollama (temperature=0, as configured in .env)
 *
 * Output: JSON written to server/benchmarks/results/extraction_benchmark.json
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const validator = require('../services/ai/validators/meetingSchema');
const Meeting = require('../models/Meeting');

const summaryExtractor = require('../services/ai/extractors/summaryExtractor');
const agendaExtractor = require('../services/ai/extractors/agendaExtractor');
const decisionExtractor = require('../services/ai/extractors/decisionExtractor');
const actionItemExtractor = require('../services/ai/extractors/actionItemExtractor');
const riskExtractor = require('../services/ai/extractors/riskExtractor');
const questionExtractor = require('../services/ai/extractors/questionExtractor');
const entityExtractor = require('../services/ai/extractors/entityExtractor');
const classifierExtractor = require('../services/ai/extractors/classifierExtractor');
const conversationIntelligenceExtractor = require('../services/ai/extractors/conversationIntelligenceExtractor');

const RESULTS_DIR = path.join(__dirname, 'results');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const RUNS = parseInt(process.env.BENCH_RUNS || '1', 10);
const TRANSCRIPT_ID = process.env.BENCH_TRANSCRIPT_ID || ''; // empty = use largest
const SOURCE = process.env.BENCH_SOURCE || 'db'; // db | synthetic
const MAX_CHARS = parseInt(process.env.BENCH_MAX_CHARS || '24000', 10);

const STAGES = [
  { name: 'Summary Extraction', extractor: summaryExtractor, validate: (d, t) => validator.validateSummary(d, t), merge: (d) => d },
  { name: 'Agenda Extraction', extractor: agendaExtractor, validate: (d, t) => validator.validateAgenda(d, t), merge: (d) => d },
  { name: 'Decision Extraction', extractor: decisionExtractor, validate: (d, t) => validator.validateDecisions(d, t), merge: (d) => d },
  { name: 'Action Item Extraction', extractor: actionItemExtractor, validate: (d, t) => validator.validateActionItems(d, t), merge: (d) => d },
  { name: 'Risk Extraction', extractor: riskExtractor, validate: (d, t) => validator.validateRisks(d, t), merge: (d) => d },
  { name: 'Question Extraction', extractor: questionExtractor, validate: (d, t) => validator.validateQuestions(d, t), merge: (d) => d },
  { name: 'Entity Extraction', extractor: entityExtractor, validate: (d, t) => validator.validateEntities(d), merge: (d) => d },
  { name: 'Classifier', extractor: classifierExtractor, validate: (d, t) => validator.validateClassifier(d), merge: (d) => d },
  { name: 'Conversation Intelligence', extractor: conversationIntelligenceExtractor, validate: (d, t) => validator.validateConversationIntelligence(d), merge: (d) => d },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / (arr.length - 1));
}

function stats(arr) {
  return {
    n: arr.length,
    mean_ms: Math.round(mean(arr)),
    median_ms: Math.round(median(arr)),
    min_ms: arr.length ? Math.round(Math.min(...arr)) : 0,
    max_ms: arr.length ? Math.round(Math.max(...arr)) : 0,
    stddev_ms: Math.round(stddev(arr)),
  };
}

async function getTranscript() {
  if (SOURCE === 'synthetic') {
    // Clearly-labeled SYNTHETIC benchmark transcript: used ONLY to measure
    // software throughput/latency. NOT used for any accuracy claim.
    const text = `
John: Welcome everyone. Let's start the project review meeting.
Sarah: We need to discuss the Q3 release plan and the deployment timeline.
Mike: I'll complete the authentication module by Friday.
John: Let's decide right now about the cloud provider.
Sarah: We have two options: AWS and Azure.
Mike: I recommend AWS because of the better integration with our existing stack.
Sarah: What about the budget limitations?
John: The budget was approved for this quarter. Let's confirm the migration plan.
Mike: We should also handle the data migration risks. There could be downtime.
Sarah: I'll prepare a risk assessment report by Wednesday.
John: Can everyone attend the next meeting on Thursday?
Sarah: Yes, I will be there.
Mike: I need to check my calendar, but I think I can make it.
John: We'll deploy on Monday after the final testing.
Sarah: Don't forget the security review. Tiago will handle it.
Mike: I'll set up a bot for container security.
John: Let's also rename the anti-abuse team to data science.
Sarah: I agree. That's a good decision.
Mike: The meeting type is a project review with follow-up required for the release.
`;
    return text.repeat(Math.max(1, Math.ceil(MAX_CHARS / text.length))).substring(0, MAX_CHARS) + '\n...[SYNTHETIC BENCHMARK TRANSCRIPT]';
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  let query = { status: 'completed', transcript: { $ne: '' } };
  if (TRANSCRIPT_ID) query._id = TRANSCRIPT_ID;
  const meetings = await mongoose.model('Meeting').find(query).sort({ wordCount: -1 }).limit(5).lean();
  if (!meetings.length) throw new Error('No completed meetings with transcripts found in DB');
  const chosen = TRANSCRIPT_ID ? meetings[0] : meetings[0]; // largest
  const t = chosen.transcript || '';
  return t.length > MAX_CHARS ? t.substring(0, MAX_CHARS) + '\n...[TRUNCATED FOR BENCHMARK]' : t;
}

// ---------------------------------------------------------------------------
// Sequential run (benchmark-only; safely reproduces the pre-parallel pipeline
// from the same stage functions, without touching production code)
// ---------------------------------------------------------------------------
async function runSequential(transcript) {
  const stages = [];
  let total = 0;
  for (const stage of STAGES) {
    const start = Date.now();
    try {
      const data = await stage.extractor.extract(transcript);
      const inference = Date.now() - start;
      stage.validate(data, transcript);
      const validation = Date.now() - start - inference;
      total += inference;
      stages.push({ name: stage.name, inferenceTime_ms: inference, validationTime_ms: validation, totalTime_ms: Date.now() - start, status: 'Success' });
    } catch (err) {
      const duration = Date.now() - start;
      total += duration;
      stages.push({ name: stage.name, inferenceTime_ms: duration, validationTime_ms: 0, totalTime_ms: duration, status: 'Failed: ' + err.message });
    }
  }
  return { total_ms: total, stages };
}

// ---------------------------------------------------------------------------
// Parallel run (mirrors production Promise.all)
// ---------------------------------------------------------------------------
async function runParallel(transcript) {
  const startAll = Date.now();
  const stageResults = await Promise.all(
    STAGES.map(async (stage) => {
      const stageStart = Date.now();
      try {
        const data = await stage.extractor.extract(transcript);
        const inference = Date.now() - stageStart;
        stage.validate(data, transcript);
        const validation = Date.now() - stageStart - inference;
        return { name: stage.name, inferenceTime_ms: inference, validationTime_ms: validation, totalTime_ms: Date.now() - stageStart, status: 'Success' };
      } catch (err) {
        const duration = Date.now() - stageStart;
        return { name: stage.name, inferenceTime_ms: duration, validationTime_ms: 0, totalTime_ms: duration, status: 'Failed: ' + err.message };
      }
    })
  );
  return { total_ms: Date.now() - startAll, stages: stageResults };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('============================================================');
  console.log('  EXTRACTION BENCHMARK: PARALLEL vs SEQUENTIAL');
  console.log('============================================================');
  console.log(`  Runs: ${RUNS}`);
  console.log(`  Source: ${SOURCE}`);
  console.log(`  Model: ${process.env.MODEL_NAME || process.env.OLLAMA_MODEL || 'qwen2.5:7b'}`);
  console.log(`  Temperature: ${process.env.TEMPERATURE || '0'}`);
  console.log(`  Max chars: ${MAX_CHARS}`);

  const transcript = await getTranscript();
  console.log(`  Transcript chars: ${transcript.length}`);

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const results = {
    benchmark: 'extraction_parallel_vs_sequential',
    timestamp: new Date().toISOString(),
    runId,
    configuration: {
      model: process.env.MODEL_NAME || process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      temperature: process.env.TEMPERATURE || '0',
      num_ctx: process.env.MAX_CONTEXT || '8192',
      maxChars: MAX_CHARS,
      source: SOURCE,
      transcriptId: TRANSCRIPT_ID || 'largest_in_db',
      numStages: STAGES.length,
      hardware: {
        cpu: '12th Gen Intel(R) Core(TM) i5-12450H (12 cores)',
        gpu: 'NVIDIA GeForce RTX 3050 Laptop GPU (CUDA 12.8)',
        ramGB: 16,
        os: 'Windows 11',
        node: process.version,
      },
    },
    runs: [],
  };

  for (let r = 1; r <= RUNS; r++) {
    console.log(`\n--- Run ${r}/${RUNS} ---`);

    const seqStart = Date.now();
    const seq = await runSequential(transcript);
    const seqWallClock = Date.now() - seqStart;

    const parStart = Date.now();
    const par = await runParallel(transcript);
    const parWallClock = Date.now() - parStart;

    const speedup = seqWallClock / parWallClock;
    const latencyReductionPercent = ((seqWallClock - parWallClock) / seqWallClock) * 100;

    const run = {
      runNumber: r,
      transcriptChars: transcript.length,
      sequential: {
        wallClockMs: seqWallClock,
        sumStageInferenceMs: seq.total_ms,
        stages: seq.stages,
      },
      parallel: {
        wallClockMs: parWallClock,
        sumStageInferenceMs: par.total_ms,
        stages: par.stages,
      },
      speedup: parseFloat(speedup.toFixed(3)),
      latencyReductionPercent: parseFloat(latencyReductionPercent.toFixed(2)),
    };
    results.runs.push(run);

    console.log(`  Sequential: ${seqWallClock}ms`);
    console.log(`  Parallel:   ${parWallClock}ms`);
    console.log(`  Speedup:    ${run.speedup}x`);
    console.log(`  Reduction:  ${run.latencyReductionPercent}%`);
  }

  // Aggregate
  const seqTimes = results.runs.map((r) => r.sequential.wallClockMs);
  const parTimes = results.runs.map((r) => r.parallel.wallClockMs);
  const speedups = results.runs.map((r) => r.speedup);
  const reductions = results.runs.map((r) => r.latencyReductionPercent);

  results.aggregate = {
    sequential: stats(seqTimes),
    parallel: stats(parTimes),
    speedup: {
      n: speedups.length,
      mean_x: parseFloat(mean(speedups).toFixed(3)),
      median_x: parseFloat(median(speedups).toFixed(3)),
      min_x: parseFloat(Math.min(...speedups).toFixed(3)),
      max_x: parseFloat(Math.max(...speedups).toFixed(3)),
    },
    latencyReductionPercent: {
      n: reductions.length,
      mean_pct: parseFloat(mean(reductions).toFixed(2)),
      median_pct: parseFloat(median(reductions).toFixed(2)),
      min_pct: parseFloat(Math.min(...reductions).toFixed(2)),
      max_pct: parseFloat(Math.max(...reductions).toFixed(2)),
    },
  };

  results.speedupFormula = 'speedup = sequential_wall_clock / parallel_wall_clock';
  results.latencyReductionFormula = 'latency_reduction_pct = ((seq - par) / seq) * 100';
  results.disclaimer =
    'These are SYNTHETIC BENCHMARK measurements of LLM inference wall-clock latency for software throughput comparison. They are NOT model accuracy metrics.';

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outFile = path.join(RESULTS_DIR, `extraction_benchmark_${runId}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\n==== AGGREGATES ====`);
  console.log(JSON.stringify(results.aggregate, null, 2));
  console.log(`\nSaved to: ${outFile}`);

  if (mongoose.connection.readyState === 1) await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  if (mongoose.connection.readyState === 1) mongoose.disconnect();
  process.exit(1);
});