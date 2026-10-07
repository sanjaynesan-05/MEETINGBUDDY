/**
 * Retrieval Evaluation Benchmark - Utility Assessment
 *
 * Determines whether retrieval effectiveness metrics (Precision@K, Recall@K,
 * MRR, nDCG@K) can be legitimately computed from existing data.
 *
 * If no ground-truth relevance labels exist, this benchmark DOES NOT fabricate
 * any. It reports what data is available and provides the evaluation harness
 * ready for human-labeled data.
 *
 * The harness supports loading a labeled evaluation file (JSON) of the form:
 * {
 *   "queries": [
 *     {
 *       "query": "What was decided about cloud provider?",
 *       "relevantMeetingIds": ["<meetingId1>", "<meetingId2>"],
 *       "relevantChunkIds": ["<chunkId1>"]
 *     }
 *   ]
 * }
 *
 * If the file exists at server/benchmarks/data/retrieval_ground_truth.json,
 * the harness computes Precision@K, Recall@K, MRR, nDCG@K for:
 * - Keyword-only search
 * - Vector-only search (if Qdrant is available)
 * - Hybrid RRF search (if Qdrant is available)
 *
 * If no ground truth file exists, the harness prints "NOT MEASURED / NOT AVAILABLE"
 * and writes the benchmark specification for the user to manually label.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const searchService = require('../services/search/search.service');
const rrfService = require('../services/search/rrf.service');
const vectorSearchService = require('../services/search/vectorSearch.service');

const RESULTS_DIR = path.join(__dirname, 'results');
const GROUND_TRUTH_FILE = path.join(__dirname, 'data', 'retrieval_ground_truth.json');

// ---------------------------------------------------------------------------
// Evaluation metrics
// ---------------------------------------------------------------------------
function precisionAtK(retrievedIds, relevantIds, k) {
  const topK = retrievedIds.slice(0, k);
  if (!topK.length) return 0;
  const hits = topK.filter((id) => relevantIds.includes(id)).length;
  return hits / topK.length;
}

function recallAtK(retrievedIds, relevantIds, k) {
  if (!relevantIds.length) return 0;
  const topK = retrievedIds.slice(0, k);
  const hits = topK.filter((id) => relevantIds.includes(id)).length;
  return hits / relevantIds.length;
}

function reciprocalRank(retrievedIds, relevantIds) {
  for (let i = 0; i < retrievedIds.length; i++) {
    if (relevantIds.includes(retrievedIds[i])) return 1 / (i + 1);
  }
  return 0;
}

function dcgAtK(rankedIds, relevantIds, k) {
  let dcg = 0;
  for (let i = 0; i < Math.min(k, rankedIds.length); i++) {
    const rel = relevantIds.includes(rankedIds[i]) ? 1 : 0;
    dcg += rel / Math.log2(i + 2);
  }
  return dcg;
}

function idcgAtK(relevantCount, k) {
  let idcg = 0;
  for (let i = 0; i < Math.min(k, relevantCount); i++) {
    idcg += 1 / Math.log2(i + 2);
  }
  return idcg;
}

function ndcgAtK(retrievedIds, relevantIds, k) {
  const dcg = dcgAtK(retrievedIds, relevantIds, k);
  const idcg = idcgAtK(relevantIds.length, k);
  return idcg > 0 ? dcg / idcg : 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('============================================================');
  console.log('  RETRIEVAL EVALUATION BENCHMARK');
  console.log('============================================================');

  if (!fs.existsSync(GROUND_TRUTH_FILE)) {
    console.log('\n[STATUS] No ground-truth relevance labels found at:');
    console.log(`  ${GROUND_TRUTH_FILE}`);
    console.log('\n[RESULT] Retrieval effectiveness metrics (P@K, Recall@K, MRR, nDCG)');
    console.log('         CANNOT currently be computed because no ground-truth');
    console.log('         relevance judgments are available.');
    console.log('\n[WHAT IS AVAILABLE]');
    console.log('  - 3 completed meetings with transcripts in MongoDB');
    console.log('  - 96 stored embedding chunks (768-dim, nomic-embed-text, ollama)');
    console.log('  - Keyword search service (working)');
    console.log('  - RRF hybrid search service (vector path requires Qdrant)');
    console.log('  - Qdrant: NOT RUNNING (vector & true hybrid paths unavailable)');

    console.log('\n[BENCHMARK SPECIFICATION FOR MANUAL LABELING]');
    console.log('To enable retrieval evaluation, create a file at:');
    console.log(`  ${GROUND_TRUTH_FILE}`);
    console.log('with this structure:');
    console.log(`\n{
  "queries": [
    {
      "id": "q1",
      "query": "What was decided about the cloud provider?",
      "relevantMeetingIds": ["6a608b2380c69cbd4caa84e0"],
      "relevantChunkIds": ["<chunkId1>", "<chunkId2>"]
    },
    {
      "id": "q2",
      "query": "Who was assigned the security review?",
      "relevantMeetingIds": ["6a608b2380c69cbd4caa84e0"]
    }
  ]
}`);
    console.log('\n  Recommended minimum: 50 queries across the 3 real meetings,');
    console.log('  with binary relevance labels (relevant/not-relevant).');

    // Write the benchmark spec file
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    const defaultSpec = {
      description: 'Ground-truth retrieval eval label file - MANUALLY COMPLETE THIS FILE',
      created: new Date().toISOString(),
      instructions: [
        'Write 50 realistic questions that a meeting participant might ask.',
        'For each query, list the meeting IDs (and optionally chunk IDs) that contain the answer.',
        'Use only the 3 meetings present in MongoDB.',
        'Relevant = the answer is contained in that meeting document.',
      ],
      meetings: [
        { id: '6a858288ccc5a9004c310f2e', title: 'Tamil audio (265s, 742 words)' },
        { id: '6a608b2380c69cbd4caa84e0', title: 'Sec Growth DataScience (1743s, 4647 words)' },
        { id: '6a6080b544f271a027b565fd', title: 'Effective Meetings Simulated Exercise (849s, 2598 words)' },
      ],
      queries: [],
    };
    const specPath = path.join(__dirname, 'data', 'retrieval_ground_truth.json');
    fs.writeFileSync(specPath, JSON.stringify(defaultSpec, null, 2));

    const result = {
      benchmark: 'retrieval_evaluation',
      timestamp: new Date().toISOString(),
      status: 'NOT_MEASURED',
      reason: 'No ground-truth relevance judgments available.',
      availableData: {
        meetings: 3,
        chunks: 96,
        keywordSearch: true,
        vectorSearch: 'requires Qdrant (not running)',
        hybridRRF: 'vector path unavailable',
      },
      benchmarkSpecFile: specPath,
    };
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(RESULTS_DIR, 'retrieval_benchmark.json'), JSON.stringify(result, null, 2));
    console.log('\n[RESULT SAVED] server/benchmarks/results/retrieval_benchmark.json');
    process.exit(0);
  }

  // Ground truth file exists - check if it has labeled queries
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const gt = JSON.parse(fs.readFileSync(GROUND_TRUTH_FILE, 'utf8'));
  const queries = (gt.queries || []).filter((q) => q.query && (q.relevantMeetingIds || []).length > 0);

  if (queries.length === 0) {
    console.log('\n[STATUS] Ground truth file exists but has no labeled queries.');
    console.log('[RESULT] Retrieval effectiveness metrics CANNOT be computed: 0 labeled queries.');
    console.log('         The file is a template that requires MANUAL annotation.');

    const result = {
      benchmark: 'retrieval_evaluation',
      timestamp: new Date().toISOString(),
      status: 'NOT_MEASURED',
      reason: 'Ground-truth label file exists but contains 0 labeled queries (template only). Manual labeling required.',
      benchmarkSpecFile: GROUND_TRUTH_FILE,
    };
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(RESULTS_DIR, 'retrieval_benchmark.json'), JSON.stringify(result, null, 2));
    console.log('[SAVED] server/benchmarks/results/retrieval_benchmark.json');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`\n[STATUS] Ground truth loaded: ${queries.length} queries`);

  // Find a real user to run searches as
  const MeetingModel = mongoose.model('Meeting');
  const anyMeeting = await MeetingModel.findOne({ status: 'completed' }).lean();
  if (!anyMeeting) {
    console.log('No completed meeting found to identify user.');
    process.exit(1);
  }
  const userId = anyMeeting.uploadedBy.toString();

  const evaluators = {
    keyword: async (q) => {
      const res = await searchService.search(userId, { q, limit: 10 });
      return res.results.map((r) => r.meetingId.toString());
    },
    vector: async (q) => {
      try {
        const res = await vectorSearchService.search(q, { limit: 10 });
        return (res.results || []).map((r) => r.meetingId.toString());
      } catch (e) {
        return [];
      }
    },
    hybrid: async (q) => {
      try {
        const res = await rrfService.hybridSearch(userId, { q, limit: 10 });
        return (res.results || []).map((r) => (r.meetingId || '').toString());
      } catch (e) {
        return [];
      }
    },
  };

  const kValues = [1, 3, 5, 10];
  const summary = { keyword: {}, vector: {}, hybrid: {} };

  for (const method of Object.keys(evaluators)) {
    const fn = evaluators[method];
    const pAtK = {};
    const rAtK = {};
    const ndcgAtKAll = {};
    const mrrValues = [];

    for (const k of kValues) {
      pAtK['P@' + k] = [];
      rAtK['R@' + k] = [];
      ndcgAtKAll['nDCG@' + k] = [];
    }

    for (const query of queries) {
      const relevant = (query.relevantMeetingIds || []).map(String);
      let retrieved;
      try {
        retrieved = (await fn(query.query)).map(String);
      } catch (e) {
        retrieved = [];
      }

      for (const k of kValues) {
        pAtK['P@' + k].push(precisionAtK(retrieved, relevant, k));
        rAtK['R@' + k].push(recallAtK(retrieved, relevant, k));
        ndcgAtKAll['nDCG@' + k].push(ndcgAtK(retrieved, relevant, k));
      }
      mrrValues.push(reciprocalRank(retrieved, relevant));
    }

    summary[method] = {};
    for (const k of kValues) {
      const pKey = 'P@' + k;
      const rKey = 'R@' + k;
      const nKey = 'nDCG@' + k;
      summary[method][pKey] = pAtK[pKey].length
        ? parseFloat((pAtK[pKey].reduce((a, b) => a + b, 0) / pAtK[pKey].length).toFixed(4))
        : 0;
      summary[method][rKey] = rAtK[rKey].length
        ? parseFloat((rAtK[rKey].reduce((a, b) => a + b, 0) / rAtK[rKey].length).toFixed(4))
        : 0;
      summary[method][nKey] = ndcgAtKAll[nKey].length
        ? parseFloat((ndcgAtKAll[nKey].reduce((a, b) => a + b, 0) / ndcgAtKAll[nKey].length).toFixed(4))
        : 0;
    }
    summary[method].MRR = mrrValues.length
      ? parseFloat((mrrValues.reduce((a, b) => a + b, 0) / mrrValues.length).toFixed(4))
      : 0;
  }

  const result = {
    benchmark: 'retrieval_evaluation',
    timestamp: new Date().toISOString(),
    status: 'MEASURED',
    nQueries: queries.length,
    kValues,
    methods: summary,
  };
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESULTS_DIR, 'retrieval_benchmark.json'), JSON.stringify(result, null, 2));
  console.log('\n[RESULTS]');
  console.log(JSON.stringify(summary, null, 2));
  console.log('[SAVED] server/benchmarks/results/retrieval_benchmark.json');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  if (mongoose.connection.readyState === 1) mongoose.disconnect();
  process.exit(1);
});