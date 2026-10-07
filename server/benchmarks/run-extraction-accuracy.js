/**
 * Extraction Accuracy Benchmark
 *
 * Compares AI extraction output against manually annotated
 * ground truth for multiple meetings.
 *
 * Benchmark only — does NOT modify production code.
 */

const path = require('path');
const fs = require('fs');

require('dotenv').config({
  path: path.join(__dirname, '../.env'),
});

const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');

const GROUND_TRUTH_FILES = [
  path.join(
    __dirname,
    'data',
    'extraction_ground_truth.json'
  ),
  path.join(
    __dirname,
    'data',
    'extraction_ground_truth_sec_growth.json'
  ),
];

const RESULTS_DIR = path.join(__dirname, 'results');

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a, b) {
  const A = new Set(
    normalize(a)
      .split(' ')
      .filter(Boolean)
  );

  const B = new Set(
    normalize(b)
      .split(' ')
      .filter(Boolean)
  );

  if (!A.size || !B.size) return 0;

  const intersection = [...A].filter((x) =>
    B.has(x)
  ).length;

  const union = new Set([...A, ...B]).size;

  return intersection / union;
}

function evaluate(predicted, expected, threshold = 0.5) {
  const used = new Set();

  let truePositive = 0;

  for (const prediction of predicted) {
    let bestIndex = -1;
    let bestScore = 0;

    expected.forEach((truth, index) => {
      if (used.has(index)) return;

      const score = similarity(prediction, truth);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (
      bestScore >= threshold &&
      bestIndex !== -1
    ) {
      truePositive++;
      used.add(bestIndex);
    }
  }

  const falsePositive =
    predicted.length - truePositive;

  const falseNegative =
    expected.length - truePositive;

  const precision =
    truePositive + falsePositive === 0
      ? 0
      : truePositive /
        (truePositive + falsePositive);

  const recall =
    truePositive + falseNegative === 0
      ? 0
      : truePositive /
        (truePositive + falseNegative);

  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) /
        (precision + recall);

  return {
    truePositive,
    falsePositive,
    falseNegative,
    precision: Number(
      precision.toFixed(4)
    ),
    recall: Number(
      recall.toFixed(4)
    ),
    f1: Number(
      f1.toFixed(4)
    ),
  };
}

/**
 * Aggregate raw TP / FP / FN across meetings.
 *
 * This produces micro-averaged metrics, which is
 * appropriate when combining multiple benchmark samples.
 */
function aggregateMetrics(metricList) {
  const truePositive = metricList.reduce(
    (sum, m) => sum + m.truePositive,
    0
  );

  const falsePositive = metricList.reduce(
    (sum, m) => sum + m.falsePositive,
    0
  );

  const falseNegative = metricList.reduce(
    (sum, m) => sum + m.falseNegative,
    0
  );

  const expected = truePositive + falseNegative;
  const predicted = truePositive + falsePositive;

  const precision =
    predicted === 0
      ? 0
      : truePositive / predicted;

  const recall =
    expected === 0
      ? 0
      : truePositive / expected;

  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) /
        (precision + recall);

  return {
    expected,
    predicted,
    truePositive,
    falsePositive,
    falseNegative,
    precision: Number(
      precision.toFixed(4)
    ),
    recall: Number(
      recall.toFixed(4)
    ),
    f1: Number(
      f1.toFixed(4)
    ),
  };
}

async function evaluateMeeting(
  groundTruth
) {
  const meeting = await Meeting.findById(
    groundTruth.meetingId
  ).lean();

  if (!meeting) {
    throw new Error(
      `Meeting not found: ${groundTruth.meetingId}`
    );
  }

  const ai = meeting.aiAnalysis || {};

  const predictedDecisions =
    ai.decisions || [];

  const predictedActions =
    (ai.actionItems || []).map(
      (item) => item.task || ''
    );

  const predictedRisks =
    ai.risks || [];

  const predictedQuestions =
    (
      ai.questions &&
      ai.questions.unanswered
    ) || [];

  const decisionMetrics = evaluate(
    predictedDecisions,
    groundTruth.decisions
  );

  const actionMetrics = evaluate(
    predictedActions,
    groundTruth.actionItems.map(
      (x) => x.task
    )
  );

  const riskMetrics = evaluate(
    predictedRisks,
    groundTruth.risks
  );

  const questionMetrics = evaluate(
    predictedQuestions,
    groundTruth.questions.unanswered
  );

  return {
    meeting: {
      id: groundTruth.meetingId,
      title: groundTruth.title,
    },

    results: {
      decisions: {
        expected:
          groundTruth.decisions.length,
        predicted:
          predictedDecisions.length,
        ...decisionMetrics,
      },

      actionItems: {
        expected:
          groundTruth.actionItems.length,
        predicted:
          predictedActions.length,
        ...actionMetrics,
      },

      risks: {
        expected:
          groundTruth.risks.length,
        predicted:
          predictedRisks.length,
        ...riskMetrics,
      },

      unansweredQuestions: {
        expected:
          groundTruth.questions.unanswered
            .length,
        predicted:
          predictedQuestions.length,
        ...questionMetrics,
      },
    },
  };
}

async function main() {
  console.log(
    '============================================================'
  );

  console.log(
    '       MULTI-MEETING EXTRACTION ACCURACY BENCHMARK'
  );

  console.log(
    '============================================================'
  );

  console.log(
    `Ground-truth datasets: ${GROUND_TRUTH_FILES.length}`
  );

  /*
   * ----------------------------------------------------------
   * Validate ground-truth files
   * ----------------------------------------------------------
   */

  const groundTruths = [];

  for (const file of GROUND_TRUTH_FILES) {
    if (!fs.existsSync(file)) {
      throw new Error(
        `Ground truth file not found:\n${file}`
      );
    }

    const data = JSON.parse(
      fs.readFileSync(file, 'utf8')
    );

    groundTruths.push(data);

    console.log(
      `\nLoaded: ${path.basename(file)}`
    );

    console.log(
      `  Meeting: ${data.title}`
    );

    console.log(
      `  Decisions: ${data.decisions.length}`
    );

    console.log(
      `  Action Items: ${data.actionItems.length}`
    );

    console.log(
      `  Risks: ${data.risks.length}`
    );

    console.log(
      `  Unanswered Questions: ${
        data.questions.unanswered.length
      }`
    );
  }

  /*
   * ----------------------------------------------------------
   * Connect MongoDB
   * ----------------------------------------------------------
   */

  await mongoose.connect(
    process.env.MONGO_URI,
    {
      serverSelectionTimeoutMS: 5000,
    }
  );

  /*
   * ----------------------------------------------------------
   * Evaluate every meeting
   * ----------------------------------------------------------
   */

  const meetingResults = [];

  for (const groundTruth of groundTruths) {
    console.log(
      `\nEvaluating: ${groundTruth.title}`
    );

    const result =
      await evaluateMeeting(
        groundTruth
      );

    meetingResults.push(result);

    console.log(
      JSON.stringify(
        result.results,
        null,
        2
      )
    );
  }

  /*
   * ----------------------------------------------------------
   * Aggregate metrics by extraction category
   * ----------------------------------------------------------
   */

  const overall = {
    decisions: aggregateMetrics(
      meetingResults.map(
        (m) => m.results.decisions
      )
    ),

    actionItems: aggregateMetrics(
      meetingResults.map(
        (m) => m.results.actionItems
      )
    ),

    risks: aggregateMetrics(
      meetingResults.map(
        (m) => m.results.risks
      )
    ),

    unansweredQuestions:
      aggregateMetrics(
        meetingResults.map(
          (m) =>
            m.results.unansweredQuestions
        )
      ),
  };

  /*
   * ----------------------------------------------------------
   * Macro average
   *
   * Average of the four category F1 scores.
   * ----------------------------------------------------------
   */

  const macroPrecision =
    (
      overall.decisions.precision +
      overall.actionItems.precision +
      overall.risks.precision +
      overall.unansweredQuestions.precision
    ) / 4;

  const macroRecall =
    (
      overall.decisions.recall +
      overall.actionItems.recall +
      overall.risks.recall +
      overall.unansweredQuestions.recall
    ) / 4;

  const macroF1 =
    (
      overall.decisions.f1 +
      overall.actionItems.f1 +
      overall.risks.f1 +
      overall.unansweredQuestions.f1
    ) / 4;

  /*
   * ----------------------------------------------------------
   * Final benchmark object
   * ----------------------------------------------------------
   */

  const results = {
    benchmark:
      'multi_meeting_extraction_accuracy',

    timestamp:
      new Date().toISOString(),

    datasetCount:
      groundTruths.length,

    meetings:
      meetingResults,

    overall: {
      decisions:
        overall.decisions,

      actionItems:
        overall.actionItems,

      risks:
        overall.risks,

      unansweredQuestions:
        overall.unansweredQuestions,

      macroAverage: {
        precision: Number(
          macroPrecision.toFixed(4)
        ),

        recall: Number(
          macroRecall.toFixed(4)
        ),

        f1: Number(
          macroF1.toFixed(4)
        ),
      },
    },

    methodology: {
      matching:
        'Token Jaccard similarity',

      similarityThreshold: 0.5,

      averaging:
        'Micro-average across meetings for each extraction category; macro-average across the four categories',

      metrics: [
        'Precision',
        'Recall',
        'F1',
      ],

      note:
        'Ground truth was manually annotated from the meeting transcripts. Benchmark evaluates extraction quality only and does not modify production extraction code.',
    },
  };

  /*
   * ----------------------------------------------------------
   * Save results
   * ----------------------------------------------------------
   */

  fs.mkdirSync(
    RESULTS_DIR,
    { recursive: true }
  );

  const outputFile = path.join(
    RESULTS_DIR,
    'extraction_accuracy.json'
  );

  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      results,
      null,
      2
    )
  );

  /*
   * ----------------------------------------------------------
   * Console summary
   * ----------------------------------------------------------
   */

  console.log(
    '\n============================================================'
  );

  console.log(
    '                    FINAL RESULTS'
  );

  console.log(
    '============================================================'
  );

  console.log(
    JSON.stringify(
      results.overall,
      null,
      2
    )
  );

  console.log(
    `\n[SAVED] ${outputFile}`
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(
    '\nBenchmark failed:',
    error
  );

  if (
    mongoose.connection.readyState === 1
  ) {
    mongoose.disconnect();
  }

  process.exit(1);
});