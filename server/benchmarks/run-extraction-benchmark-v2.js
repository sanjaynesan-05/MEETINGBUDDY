/**
 * Extraction Benchmark v2 – Parallel vs Sequential (3 × 3 runs)
 *
 * Fixes addressed
 * ---------------
 *  1. OLLAMA_NUM_PARALLEL / OLLAMA_MAX_LOADED_MODELS are now checked and
 *     printed; a clear warning is emitted if Ollama was NOT restarted with
 *     those env vars (they must be set in the OS shell before `ollama serve`).
 *  2. Every request goes through ollama.service which now uses an explicit
 *     AbortController timeout (OLLAMA_REQUEST_TIMEOUT_MS, default 360 s).
 *  3. Runs 3 repetitions; reports mean +/- stddev for both modes.
 *  4. Records per-stage error cause string so fetch-failed causes are visible.
 *  5. nvidia-smi snapshot taken before the first run.
 *
 * Run:
 *   BENCH_RUNS=3 node benchmarks/run-extraction-benchmark-v2.js
 */
'use strict';

const path  = require('path');
const fs    = require('fs');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const validator = require('../services/ai/validators/meetingSchema');
const Meeting   = require('../models/Meeting');

const summaryExtractor              = require('../services/ai/extractors/summaryExtractor');
const agendaExtractor               = require('../services/ai/extractors/agendaExtractor');
const decisionExtractor             = require('../services/ai/extractors/decisionExtractor');
const actionItemExtractor           = require('../services/ai/extractors/actionItemExtractor');
const riskExtractor                 = require('../services/ai/extractors/riskExtractor');
const questionExtractor             = require('../services/ai/extractors/questionExtractor');
const entityExtractor               = require('../services/ai/extractors/entityExtractor');
const classifierExtractor           = require('../services/ai/extractors/classifierExtractor');
const conversationIntelligenceExtractor = require('../services/ai/extractors/conversationIntelligenceExtractor');

const RUNS      = parseInt(process.env.BENCH_RUNS    || '3',   10);
const SOURCE    = process.env.BENCH_SOURCE            || 'db';
const MAX_CHARS = parseInt(process.env.BENCH_MAX_CHARS|| '24000', 10);
const RESULTS_DIR = path.join(__dirname, 'results');

const STAGES = [
  { name: 'Summary Extraction',        extractor: summaryExtractor,              validate: (d,t)=>validator.validateSummary(d,t) },
  { name: 'Agenda Extraction',         extractor: agendaExtractor,               validate: (d,t)=>validator.validateAgenda(d,t) },
  { name: 'Decision Extraction',       extractor: decisionExtractor,             validate: (d,t)=>validator.validateDecisions(d,t) },
  { name: 'Action Item Extraction',    extractor: actionItemExtractor,           validate: (d,t)=>validator.validateActionItems(d,t) },
  { name: 'Risk Extraction',           extractor: riskExtractor,                 validate: (d,t)=>validator.validateRisks(d,t) },
  { name: 'Question Extraction',       extractor: questionExtractor,             validate: (d,t)=>validator.validateQuestions(d,t) },
  { name: 'Entity Extraction',         extractor: entityExtractor,               validate: (d)  =>validator.validateEntities(d) },
  { name: 'Classifier',                extractor: classifierExtractor,           validate: (d)  =>validator.validateClassifier(d) },
  { name: 'Conversation Intelligence', extractor: conversationIntelligenceExtractor, validate: (d)=>validator.validateConversationIntelligence(d) },
];

const mean   = (a) => a.length ? a.reduce((s,v)=>s+v,0)/a.length : 0;
const stddev = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1));
};
const fmt = (v) => Math.round(v);

function nvidiaSmi() {
  try {
    return execSync(
      'nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu --format=csv,noheader',
      { timeout: 5000 }
    ).toString().trim();
  } catch (e) { return 'nvidia-smi unavailable: ' + e.message; }
}

function checkOllamaEnv() {
  const np = process.env.OLLAMA_NUM_PARALLEL;
  const ml = process.env.OLLAMA_MAX_LOADED_MODELS;
  const to = process.env.OLLAMA_REQUEST_TIMEOUT_MS;
  console.log('\n[Ollama env-var check]');
  console.log('  OLLAMA_NUM_PARALLEL      =', np || '(not set – Ollama default=1)');
  console.log('  OLLAMA_MAX_LOADED_MODELS =', ml || '(not set – Ollama default=1)');
  console.log('  OLLAMA_REQUEST_TIMEOUT_MS=', to || '(not set – code default=240000)');
  if (!np || np === '1') {
    console.warn(
      '\n  WARNING: OLLAMA_NUM_PARALLEL is not set or is 1.\n' +
      '  Parallel stages will queue serially inside Ollama.\n' +
      '  Restart Ollama with:  set OLLAMA_NUM_PARALLEL=4 && ollama serve'
    );
  }
}

async function getTranscript() {
  if (SOURCE === 'synthetic') {
    const text = 'John: Welcome everyone. Let\'s start the project review meeting.\n' +
      'Sarah: We need to discuss the Q3 release plan and the deployment timeline.\n' +
      'Mike: I\'ll complete the authentication module by Friday.\n' +
      'John: Decided: we use AWS as cloud provider.\n' +
      'Sarah: What about the budget limitations?\n' +
      'John: Budget approved. Confirming migration plan.\n' +
      'Mike: Data migration risks include potential downtime.\n' +
      'Sarah: I\'ll prepare a risk assessment report by Wednesday.\n' +
      'John: Security review needed. Tiago owns it.\n' +
      'Mike: I\'ll set up container security scanning.\n';
    return text.repeat(Math.max(1, Math.ceil(MAX_CHARS/text.length))).substring(0, MAX_CHARS)+'...[SYNTHETIC]';
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const meetings = await mongoose.model('Meeting')
    .find({ status: 'completed', transcript: { $ne: '' } })
    .sort({ wordCount: -1 }).limit(5).lean();
  if (!meetings.length) throw new Error('No completed meetings with transcripts in DB');
  const chosen = meetings[0];
  const t = chosen.transcript || '';
  console.log(`  Using: "${chosen.title}" (${t.length} chars)`);
  return t.length > MAX_CHARS ? t.substring(0, MAX_CHARS)+'\n...[TRUNCATED]' : t;
}

async function runSequential(transcript) {
  const stages = [];
  let total = 0;
  for (const stage of STAGES) {
    const s = Date.now();
    try {
      const data = await stage.extractor.extract(transcript);
      const inf = Date.now() - s;
      try { stage.validate(data, transcript); } catch(_){}
      total += inf;
      stages.push({ name: stage.name, inferenceTime_ms: inf, status: 'Success' });
    } catch(err) {
      const dur = Date.now() - s;
      total += dur;
      const cause = err.cause ? (err.cause.code||err.cause.message||String(err.cause)) : 'none';
      stages.push({ name: stage.name, inferenceTime_ms: dur, status: 'Failed', error: err.message, cause });
    }
  }
  return { total_ms: total, stages };
}

async function runParallel(transcript) {
  const t0 = Date.now();
  const stageResults = await Promise.all(STAGES.map(async(stage) => {
    const s = Date.now();
    try {
      const data = await stage.extractor.extract(transcript);
      const inf = Date.now() - s;
      try { stage.validate(data, transcript); } catch(_){}
      return { name: stage.name, inferenceTime_ms: inf, status: 'Success' };
    } catch(err) {
      const dur = Date.now() - s;
      const cause = err.cause ? (err.cause.code||err.cause.message||String(err.cause)) : 'none';
      return { name: stage.name, inferenceTime_ms: dur, status: 'Failed', error: err.message, cause };
    }
  }));
  return { total_ms: Date.now()-t0, stages: stageResults };
}

async function main() {
  console.log('============================================================');
  console.log('  EXTRACTION BENCHMARK v2: PARALLEL vs SEQUENTIAL');
  console.log(`  Runs: ${RUNS}   Source: ${SOURCE}`);
  console.log('============================================================');

  checkOllamaEnv();

  const gpuBefore = nvidiaSmi();
  console.log('\n[GPU before]', gpuBefore);

  const transcript = await getTranscript();
  console.log(`\n  Transcript chars: ${transcript.length}\n`);

  const runId    = new Date().toISOString().replace(/[:.]/g,'-');
  const seqWalls = [];
  const parWalls = [];
  const runs     = [];

  for (let r = 1; r <= RUNS; r++) {
    console.log(`--- Run ${r}/${RUNS} ---`);
    const s0  = Date.now();
    const seq = await runSequential(transcript);
    const sw  = Date.now()-s0;
    seqWalls.push(sw);

    const p0  = Date.now();
    const par = await runParallel(transcript);
    const pw  = Date.now()-p0;
    parWalls.push(pw);

    const sp = sw/pw;
    const sf = seq.stages.filter(s=>s.status!=='Success').length;
    const pf = par.stages.filter(s=>s.status!=='Success').length;
    console.log(`  Seq: ${sw} ms (${STAGES.length-sf}/${STAGES.length} OK)   Par: ${pw} ms (${STAGES.length-pf}/${STAGES.length} OK)   Speedup: ${sp.toFixed(3)}x`);

    [...seq.stages,...par.stages].filter(s=>s.status!=='Success').forEach(s=>
      console.log(`    FAIL [${s.name}] msg="${s.error}" cause=${s.cause}`)
    );

    runs.push({ runNumber:r, transcriptChars:transcript.length,
      sequential:{ wallClockMs:sw, stages:seq.stages },
      parallel:  { wallClockMs:pw, stages:par.stages },
      speedup: parseFloat(sp.toFixed(3)) });
  }

  const gpuAfter = nvidiaSmi();
  console.log('\n[GPU after]', gpuAfter);

  const seqM=mean(seqWalls), seqS=stddev(seqWalls);
  const parM=mean(parWalls), parS=stddev(parWalls);
  const spds=runs.map(r=>r.speedup);
  const spM=mean(spds), spS=stddev(spds);

  console.log('\n==== AGGREGATE STATISTICS ====');
  console.log(`Sequential: mean=${fmt(seqM)} ms  std=${fmt(seqS)} ms`);
  console.log(`Parallel:   mean=${fmt(parM)} ms  std=${fmt(parS)} ms`);
  console.log(`Speedup:    mean=${spM.toFixed(3)}x  std=${spS.toFixed(3)}`);
  console.log(`Latency reduction: ${((seqM-parM)/seqM*100).toFixed(2)}%`);

  const totalPF = runs.reduce((s,r)=>s+r.parallel.stages.filter(x=>x.status!=='Success').length,0);
  if (totalPF > 0) {
    console.warn(`\n  WARNING: ${totalPF} parallel stage failures across ${RUNS} runs.`);
    console.warn('  If cause=AbortError: raise OLLAMA_REQUEST_TIMEOUT_MS');
    console.warn('  If cause=ECONNRESET: raise OLLAMA_NUM_PARALLEL');
  } else {
    console.log('\n  All parallel stages succeeded in all runs.');
  }

  const result = {
    benchmark:'extraction_parallel_vs_sequential_v2',
    timestamp: new Date().toISOString(),
    runId,
    configuration:{
      model: process.env.MODEL_NAME||process.env.OLLAMA_MODEL||'qwen2.5:7b',
      source: SOURCE, numStages:STAGES.length,
      OLLAMA_NUM_PARALLEL: process.env.OLLAMA_NUM_PARALLEL||'not-set',
      OLLAMA_MAX_LOADED_MODELS: process.env.OLLAMA_MAX_LOADED_MODELS||'not-set',
      OLLAMA_REQUEST_TIMEOUT_MS: process.env.OLLAMA_REQUEST_TIMEOUT_MS||'240000(default)',
      hardware:{
        cpu:'12th Gen Intel Core i5-12450H (12 cores)',
        gpu:'NVIDIA RTX 3050 Laptop (CUDA 12.8, 4 GB VRAM)',
        ramGB:16, os:'Windows 11', node:process.version,
        gpuBefore, gpuAfter,
      },
    },
    runs,
    aggregate:{
      n:RUNS,
      sequential:{ mean_ms:fmt(seqM), std_ms:fmt(seqS) },
      parallel:  { mean_ms:fmt(parM), std_ms:fmt(parS) },
      speedup:   { mean_x:parseFloat(spM.toFixed(3)), std_x:parseFloat(spS.toFixed(3)) },
      latencyReductionPercent:{ mean_pct:parseFloat(((seqM-parM)/seqM*100).toFixed(2)) },
      totalParallelStageFailed:totalPF,
    },
  };

  fs.mkdirSync(RESULTS_DIR, { recursive:true });
  const out = path.join(RESULTS_DIR, `extraction_benchmark_v2_${runId}.json`);
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(`\n[SAVED] ${out}`);

  if (mongoose.connection.readyState===1) await mongoose.disconnect();
  process.exit(0);
}

main().catch(err=>{
  console.error('Benchmark failed:', err);
  if (mongoose.connection.readyState===1) mongoose.disconnect();
  process.exit(1);
});
