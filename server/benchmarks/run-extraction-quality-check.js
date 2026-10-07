/**
 * Extraction Quality Assessment
 *
 * Determines whether structured extraction accuracy metrics (Precision, Recall,
 * F1) can be legitimately computed for:
 *   - Decisions
 *   - Action Items
 *   - Risks
 *   - Questions
 *
 * Rule: DO NOT fabricate ground truth. Report NOT MEASURED if no
 * reference/annotated labels exist.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');

const RESULTS_DIR = path.join(__dirname, 'results');

async function main() {
  console.log('============================================================');
  console.log('  EXTRACTION QUALITY ASSESSMENT');
  console.log('============================================================');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const meetings = await Meeting.find({ status: 'completed' }).lean();

  const report = {
    benchmark: 'extraction_quality_assessment',
    timestamp: new Date().toISOString(),
    status: 'NOT_MEASURED',
    reason: 'No annotated reference labels (ground truth) exist for extraction quality evaluation.',
    evidence: {
      referenceSummaries: 'NOT FOUND - no reference summary data exists in repository',
      expectedDecisions: 'NOT FOUND - no gold-standard decision labels',
      expectedActionItems: 'NOT FOUND - no gold-standard action item labels',
      expectedRisks: 'NOT FOUND - no gold-standard risk labels',
      annotatedTranscripts: 'NOT FOUND - test/stt/ directories are empty',
      manuallyVerifiedOutputs: 'NOT FOUND - no verified meeting outputs in repository',
      testFixtures: 'NOT FOUND - no test fixtures for extraction quality',
    },
    whatExists: {
      meetings: meetings.length,
      extractedDecisions: meetings.reduce((a, m) => a + (m.aiAnalysis?.decisions?.length || 0), 0),
      extractedActionItems: meetings.reduce((a, m) => a + (m.aiAnalysis?.actionItems?.length || 0), 0),
      extractedRisks: meetings.reduce((a, m) => a + (m.aiAnalysis?.risks?.length || 0), 0),
      note: 'Extraction outputs exist but no labeled gold-standard to compare them against.',
    },
    recommendation: {
      minimumManualVerificationSet: [
        'Manually verify 5 meetings x ~10 extracted items = ~50 action items across the 3 real meetings.',
        'Label each extracted item as: correct, partially-correct, incorrect, missed (gold standard).',
        'After labeling, compute token/partial matching P/R/F1 using the benchmark harness.',
      ],
      requiredFile: 'server/benchmarks/data/extraction_ground_truth.json',
    },
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESULTS_DIR, 'extraction_quality.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log('[SAVED] server/benchmarks/results/extraction_quality.json');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Assessment failed:', err);
  if (mongoose.connection.readyState === 1) mongoose.disconnect();
  process.exit(1);
});