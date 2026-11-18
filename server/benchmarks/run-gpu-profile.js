/**
 * GPU Memory Profiler – Item 2
 *
 * Purpose
 * -------
 * The RTX 3050 Laptop GPU has 4 GB VRAM.
 * Qwen2.5-7B Q4_K_M is ~4.7 GB → the model is partly on CPU.
 * This script:
 *   1. Calls the Ollama REST API to get the loaded model's metadata
 *      (quantization level, size, num_gpu layers).
 *   2. Polls nvidia-smi every 2 s during one inference call.
 *   3. Reports peak VRAM used, free VRAM, and GPU utilisation.
 *   4. Writes results/gpu_profile.json.
 *
 * Run: node benchmarks/run-gpu-profile.js
 */
'use strict';

const path  = require('path');
const fs    = require('fs');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const RESULTS_DIR = path.join(__dirname, 'results');

// Use the ollama service (which now has the AbortController timeout)
const ollamaService = require('../services/ai/ollama.service');

function nvidiaSmiRow() {
  try {
    const out = execSync(
      'nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu --format=csv,noheader,nounits',
      { timeout: 5000 }
    ).toString().trim();
    // e.g. "NVIDIA GeForce RTX 3050 Laptop GPU, 4096, 3821, 275, 98, 72"
    const parts = out.split(',').map(s => s.trim());
    return {
      name:         parts[0],
      total_MiB:    parseInt(parts[1], 10),
      used_MiB:     parseInt(parts[2], 10),
      free_MiB:     parseInt(parts[3], 10),
      utilization_pct: parseInt(parts[4], 10),
      temp_C:       parseInt(parts[5], 10),
      ts:           Date.now(),
    };
  } catch (e) {
    return { error: e.message, ts: Date.now() };
  }
}

async function getOllamaModelInfo() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: process.env.MODEL_NAME || process.env.OLLAMA_MODEL || 'qwen2.5:7b' }),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return {
      modelName:     data.modelinfo?.['general.name']              || 'unknown',
      architecture:  data.modelinfo?.['general.architecture']      || 'unknown',
      quantization:  data.details?.quantization_level              || data.modelinfo?.['general.file_type'] || 'unknown',
      parameters:    data.details?.parameter_size                   || 'unknown',
      family:        data.details?.family                           || 'unknown',
      numGpuLayers:  data.model_info?.num_gpu_layers               || 'unknown',
      contextLength: data.modelinfo?.['qwen2.context_length']      || 'unknown',
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function getOllamaRunningModels() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/ps`);
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  console.log('============================================================');
  console.log('  GPU MEMORY PROFILER');
  console.log('============================================================');

  // 1. Model metadata
  console.log('\n[Step 1] Fetching model metadata from Ollama...');
  const modelInfo = await getOllamaModelInfo();
  console.log('  Model info:', JSON.stringify(modelInfo, null, 4));

  // 2. Running models (shows num_gpu from /api/ps)
  console.log('\n[Step 2] Currently loaded Ollama models...');
  const psInfo = await getOllamaRunningModels();
  if (psInfo.models && psInfo.models.length > 0) {
    psInfo.models.forEach(m => {
      console.log(`  ${m.name}  size_vram=${m.size_vram} B  expires=${m.expires_at}`);
    });
  } else {
    console.log('  No models currently loaded (will load on first request):', JSON.stringify(psInfo));
  }

  // 3. Baseline VRAM
  const baseline = nvidiaSmiRow();
  console.log('\n[Step 3] Baseline VRAM (before inference):');
  console.log(`  used=${baseline.used_MiB} MiB  free=${baseline.free_MiB} MiB  total=${baseline.total_MiB} MiB`);

  // 4. Poll VRAM during inference
  console.log('\n[Step 4] Running one inference call, polling VRAM every 2 s...');
  const pollInterval = [];
  const poll = setInterval(() => {
    const row = nvidiaSmiRow();
    pollInterval.push(row);
    if (!row.error) {
      console.log(`  t=${((row.ts - baseline.ts)/1000).toFixed(1)}s  used=${row.used_MiB}MiB  util=${row.utilization_pct}%  temp=${row.temp_C}C`);
    }
  }, 2000);

  const testPrompt = `You are a meeting assistant. Extract decisions from this short transcript as JSON {"decisions":[]}.
Transcript: John said we will use AWS. Sarah agreed. Mike will handle the migration by Friday.`;

  let inferenceResult;
  const t0 = Date.now();
  try {
    inferenceResult = await ollamaService.chat(testPrompt, { format: 'json' });
    console.log(`  Inference done in ${Date.now()-t0} ms`);
    console.log('  Result (first 200 chars):', (inferenceResult||'').substring(0, 200));
  } catch(err) {
    console.error('  Inference failed:', err.message);
    inferenceResult = null;
  } finally {
    clearInterval(poll);
  }

  // One final reading
  const peak = nvidiaSmiRow();
  pollInterval.push(peak);

  // 5. Analysis
  const maxUsed = Math.max(...pollInterval.filter(r=>!r.error).map(r=>r.used_MiB));
  const minFree = Math.min(...pollInterval.filter(r=>!r.error).map(r=>r.free_MiB));

  console.log('\n[Results]');
  console.log(`  Peak VRAM used: ${maxUsed} MiB  (${(maxUsed/1024).toFixed(2)} GiB)`);
  console.log(`  Min VRAM free:  ${minFree} MiB  (${(minFree/1024).toFixed(2)} GiB)`);
  console.log(`  Total VRAM:     ${baseline.total_MiB} MiB  (${(baseline.total_MiB/1024).toFixed(2)} GiB)`);

  const modelSizeGiB = (maxUsed - baseline.used_MiB) / 1024;
  const gpuFraction  = Math.min(1, modelSizeGiB / (baseline.total_MiB / 1024));
  console.log(`  Estimated model VRAM footprint: ~${modelSizeGiB.toFixed(2)} GiB`);
  if (modelSizeGiB > (baseline.total_MiB / 1024)) {
    console.log('  STATUS: Model is LARGER than available VRAM – CPU offload is active.');
    console.log('  RECOMMENDATION: Use qwen2.5:1.5b or qwen2.5:3b, or Qwen2.5-7B-IQ2_S (< 3 GiB).');
  } else {
    console.log('  STATUS: Model fits within GPU VRAM.');
  }

  // 6. Ollama ps after inference
  const psAfter = await getOllamaRunningModels();
  let numGpuLayers = 'unknown';
  if (psAfter.models && psAfter.models.length > 0) {
    const m = psAfter.models[0];
    numGpuLayers = m.details?.num_gpu_layers || 'not reported';
    console.log(`\n  Loaded model num_gpu_layers: ${numGpuLayers}`);
    console.log(`  size_vram: ${m.size_vram} B  (${(m.size_vram/1024/1024/1024).toFixed(2)} GiB)`);
  }

  const report = {
    benchmark: 'gpu_memory_profile',
    timestamp: new Date().toISOString(),
    model: process.env.MODEL_NAME || process.env.OLLAMA_MODEL || 'qwen2.5:7b',
    modelInfo,
    hardware: {
      gpu: baseline.name || 'NVIDIA RTX 3050 Laptop',
      total_MiB: baseline.total_MiB,
    },
    baseline_used_MiB: baseline.used_MiB,
    peak_used_MiB: maxUsed,
    min_free_MiB: minFree,
    estimated_model_GiB: parseFloat(modelSizeGiB.toFixed(2)),
    gpu_fits_model: modelSizeGiB <= (baseline.total_MiB / 1024),
    num_gpu_layers: numGpuLayers,
    pollSeries: pollInterval,
    inference_ok: inferenceResult !== null,
    recommendation: modelSizeGiB > (baseline.total_MiB / 1024)
      ? 'Model exceeds VRAM: CPU offload active. Consider qwen2.5:3b or a smaller quantization (IQ2_S <3 GiB).'
      : 'Model fits in GPU VRAM.',
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const out = path.join(RESULTS_DIR, 'gpu_profile.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\n[SAVED] ${out}`);
  process.exit(0);
}

main().catch(err => {
  console.error('GPU profiler failed:', err);
  process.exit(1);
});
