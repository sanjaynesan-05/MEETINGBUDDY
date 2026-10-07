/**
 * Transcript-Grounding Evaluation Benchmark
 *
 * PURPOSE:
 * Inspects the actual transcript-grounding implementation and measures
 * directly observable system statistics from existing stored data.
 *
 * The grounding implementation (server/services/ai/validators/meetingSchema.js
 * - verifySemanticMatch) uses a lexical-overlap threshold of 0.2 (20%):
 *   matchRatio = matchedWords / extractedWords
 *   if (matchRatio < 0.2) -> "Semantic match: FAIL"
 *
 * IMPORTANT: The current implementation LOGS failures but ALWAYS KEEPS the item
 * ("Kept to prevent data loss"). No item is ever rejected/removed at runtime.
 *
 * This benchmark does NOT create fake ground truth. It reports only directly
 * observable system statistics from the production data.
 *
 * Metrics reported:
 * - total extracted items per type (decisions, action items, risks, questions)
 * - items that FAIL the 20% lexical-overlap threshold
 * - unsupported-item rate = failing_count / total_count
 * - rejection count (0, because they are kept)
 * - false-rejection count: NOT MEASURED (requires validated ground truth)
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Meeting = require('../models/Meeting');

const RESULTS_DIR = path.join(__dirname, 'results');
const THRESHOLD = 0.2; // 20% lexical overlap threshold from meetingSchema.js

/**
 * Re-implements the verifySemanticMatch algorithm without mutating anything.
 */
function semanticCheck(text, transcriptLower) {
  if (!transcriptLower) return { matchRatio: 1, matched: true, matchedWords: 0, totalWords: 0 };
  if (!text || typeof text !== 'string') return { matchRatio: 1, matched: true, matchedWords: 0, totalWords: 0 };

  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  if (!words.length) return { matchRatio: 1, matched: true, matchedWords: 0, totalWords: 0 };

  let matchedWords = 0;
  for (const word of words) {
    if (transcriptLower.includes(word)) matchedWords++;
  }
  const matchRatio = matchedWords / words.length;

  return {
    matchRatio: parseFloat(matchRatio.toFixed(4)),
    matched: matchRatio >= THRESHOLD,
    matchedWords,
    totalWords: words.length,
  };
}

async function main() {
  console.log('============================================================');
  console.log('  TRANSCRIPT-GROUNDING EVALUATION');
  console.log('============================================================');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const meetings = await Meeting.find({ status: 'completed', transcript: { $ne: '' } }).lean();

  if (!meetings.length) {
    console.log('No completed meetings found with transcripts.');
    process.exit(1);
  }

  const typeKeys = ['decisions', 'actionItems', 'risks', 'answeredQuestions', 'unansweredQuestions'];

  const report = {
    benchmark: 'transcript_grounding_evaluation',
    timestamp: new Date().toISOString(),
    implementation: {
      file: 'server/services/ai/validators/meetingSchema.js',
      method: 'verifySemanticMatch',
      threshold: THRESHOLD,
      behavior: 'LOGS FAILURES BUT KEEPS ITEMS — "Kept to prevent data loss". No items are ever rejected at runtime.',
    },
    meetings: [],
    totals: {},
    aggregate: {},
    notes: {},
  };

  // Initialize totals
  for (const key of typeKeys) {
    report.totals[key] = { total: 0, grounded: 0, unsupported: 0, rate: 0 };
  }

  for (const m of meetings) {
    const transcriptLower = (m.transcript || '').toLowerCase();
    const analysis = m.aiAnalysis || {};

    const decisions = analysis.decisions || [];
    const actionItems = (analysis.actionItems || []).map((a) =>
      a && typeof a === 'object' ? a.task || '' : String(a || '')
    );
    const risks = analysis.risks || [];
    const answeredQuestions = analysis.questions?.answered || [];
    const unansweredQuestions = analysis.questions?.unanswered || [];

    const groups = {
      decisions,
      actionItems,
      risks,
      answeredQuestions,
      unansweredQuestions,
    };

    const perMeeting = { title: m.title, meetingId: m._id.toString() };

    for (const key of typeKeys) {
      const items = groups[key] || [];
      const results = items.map((text) => {
        const itemText = typeof text === 'string' ? text : String(text || '');
        return {
          text: itemText,
          ...semanticCheck(itemText, transcriptLower),
        };
      });

      const unsupported = results.filter((r) => !r.matched).length;
      const grounded = results.filter((r) => r.matched).length;

      report.totals[key].total += results.length;
      report.totals[key].unsupported += unsupported;
      report.totals[key].grounded += grounded;

      perMeeting[key] = {
        total: results.length,
        grounded,
        unsupported,
        items: results,
      };
    }

    report.meetings.push(perMeeting);
  }

  // Compute rates
  for (const key of typeKeys) {
    const d = report.totals[key];
    d.rate = d.total > 0 ? parseFloat(((d.unsupported / d.total) * 100).toFixed(2)) : 0;
  }

  // Aggregate
  const totalExtracted = Object.values(report.totals).reduce((a, t) => a + t.total, 0);
  const totalUnsupported = Object.values(report.totals).reduce((a, t) => a + t.unsupported, 0);
  const totalGrounded = Object.values(report.totals).reduce((a, t) => a + t.grounded, 0);

  report.aggregate = {
    meetings: meetings.length,
    totalExtractedItems: totalExtracted,
    totalUnsupportedItems: totalUnsupported,
    totalGroundedItems: totalGrounded,
    overallUnsupportedRatePercent: totalExtracted > 0
      ? parseFloat(((totalUnsupported / totalExtracted) * 100).toFixed(2))
      : 0,
  };

  report.notes = {
    falseRejectionRate: 'NOT MEASURABLE - requires independently verified ground truth',
    hallucinationAccuracy:
      'This is NOT an accuracy metric. The 20% threshold is a lexical-overlap heuristic, not a validated measure of hallucination.',
    rejectionBehavior:
      `The implementation never removes items flagged as unsupported. All ${totalUnsupported} flagged items were KEPT in the final output.`,
    keyObservation:
      'The 20% threshold verified in code matches the paper claim. However, because the implementation only logs (never rejects), it cannot reduce false positives; it only serves as an audit signal.',
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outFile = path.join(RESULTS_DIR, 'grounding_benchmark.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ totals: report.totals, aggregate: report.aggregate, notes: report.notes }, null, 2));
  console.log(`\n[SAVED] ${outFile}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  if (mongoose.connection.readyState === 1) mongoose.disconnect();
  process.exit(1);
});