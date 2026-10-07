require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Meeting = require("../models/Meeting");

const ROOT = __dirname;
const RESULTS_DIR = path.join(ROOT, "results");

function section(title) {
  console.log("\n" + "=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

function safe(value) {
  if (value === undefined || value === null) return null;
  return value;
}

async function main() {
  console.log("============================================================");
  console.log("        AI MEETING INTELLIGENCE PAPER EXPERIMENT REPORT");
  console.log("============================================================");

  // ----------------------------------------------------------
  // SYSTEM INFORMATION
  // ----------------------------------------------------------

  section("1. SYSTEM INFORMATION");

  console.log("Node version:", process.version);
  console.log("Platform:", process.platform);
  console.log("Architecture:", process.arch);
  console.log("Working directory:", process.cwd());

  try {
    const pkg = require("../package.json");

    console.log("\nImportant dependencies:");

    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };

    const important = [
      "mongoose",
      "express",
      "ollama",
      "dotenv",
      "whisperx"
    ];

    for (const name of important) {
      if (deps[name]) {
        console.log(`${name}: ${deps[name]}`);
      }
    }
  } catch (err) {
    console.log("package.json could not be read");
  }

  // ----------------------------------------------------------
  // ENVIRONMENT
  // ----------------------------------------------------------

  section("2. AI / OLLAMA CONFIGURATION");

  console.log("OLLAMA_HOST:", process.env.OLLAMA_HOST || "not set");
  console.log("OLLAMA_MODEL:", process.env.OLLAMA_MODEL || "not set");

  // ----------------------------------------------------------
  // DATABASE
  // ----------------------------------------------------------

  section("3. DATABASE");

  if (!process.env.MONGO_URI) {
    console.log("ERROR: MONGO_URI is not configured.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB connected.");

  const meetingCount = await Meeting.countDocuments();

  console.log("Total meetings:", meetingCount);

  const meetings = await Meeting.find({})
    .sort({ createdAt: -1 })
    .lean();

  console.log("Meetings retrieved:", meetings.length);

  // ----------------------------------------------------------
  // MEETING STATISTICS
  // ----------------------------------------------------------

  section("4. MEETING DATASET STATISTICS");

  let totalWords = 0;
  let totalTranscriptChars = 0;
  let totalActions = 0;
  let totalDecisions = 0;
  let totalRisks = 0;
  let totalQuestions = 0;

  const meetingStats = [];

  for (const m of meetings) {
    const transcript = m.transcript || "";

    const words = transcript.trim()
      ? transcript.trim().split(/\s+/).length
      : 0;

    const decisions = m.aiAnalysis?.decisions || [];
    const actions = m.aiAnalysis?.actionItems || [];
    const risks = m.aiAnalysis?.risks || [];

    const unanswered =
      m.aiAnalysis?.questions?.unanswered || [];

    totalWords += words;
    totalTranscriptChars += transcript.length;
    totalActions += actions.length;
    totalDecisions += decisions.length;
    totalRisks += risks.length;
    totalQuestions += unanswered.length;

    meetingStats.push({
      id: m._id.toString(),
      title: m.title,
      language: m.language,
      duration: m.duration,
      words,
      transcriptChars: transcript.length,
      decisions: decisions.length,
      actionItems: actions.length,
      risks: risks.length,
      unansweredQuestions: unanswered.length,
      createdAt: m.createdAt
    });
  }

  console.log("Total transcript words:", totalWords);
  console.log("Total transcript characters:", totalTranscriptChars);
  console.log("Total extracted decisions:", totalDecisions);
  console.log("Total extracted action items:", totalActions);
  console.log("Total extracted risks:", totalRisks);
  console.log("Total unanswered questions:", totalQuestions);

  console.log("\nPer-meeting statistics:");

  console.table(meetingStats);

  // ----------------------------------------------------------
  // CURRENT EXTRACTION RESULTS
  // ----------------------------------------------------------

  section("5. CURRENT EXTRACTION OUTPUTS");

  for (const m of meetings.slice(0, 10)) {
    console.log("\nMeeting:", m.title);
    console.log("ID:", m._id.toString());

    console.log("\nDecisions:");
    console.log(
      JSON.stringify(
        m.aiAnalysis?.decisions || [],
        null,
        2
      )
    );

    console.log("\nAction Items:");
    console.log(
      JSON.stringify(
        m.aiAnalysis?.actionItems || [],
        null,
        2
      )
    );

    console.log("\nRisks:");
    console.log(
      JSON.stringify(
        m.aiAnalysis?.risks || [],
        null,
        2
      )
    );

    console.log("\nUnanswered Questions:");
    console.log(
      JSON.stringify(
        m.aiAnalysis?.questions?.unanswered || [],
        null,
        2
      )
    );
  }

  // ----------------------------------------------------------
  // BENCHMARK RESULT
  // ----------------------------------------------------------

  section("6. EXISTING BENCHMARK RESULT");

  const benchmarkFile = path.join(
    RESULTS_DIR,
    "extraction_accuracy.json"
  );

  if (fs.existsSync(benchmarkFile)) {
    const result = JSON.parse(
      fs.readFileSync(benchmarkFile, "utf8")
    );

    console.log(
      JSON.stringify(result, null, 2)
    );
  } else {
    console.log(
      "Benchmark result file not found:",
      benchmarkFile
    );
  }

  // ----------------------------------------------------------
  // SOURCE FILE INVENTORY
  // ----------------------------------------------------------

  section("7. EXPERIMENT / BENCHMARK FILES");

  function listFiles(dir, prefix = "") {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, {
      withFileTypes: true
    });

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        console.log(
          prefix + "[DIR] " + entry.name
        );

        listFiles(
          full,
          prefix + "  "
        );
      } else {
        const stat = fs.statSync(full);

        console.log(
          prefix +
          entry.name +
          ` (${stat.size} bytes)`
        );
      }
    }
  }

  listFiles(ROOT);

  // ----------------------------------------------------------
  // EXTRACTOR SOURCE
  // ----------------------------------------------------------

  section("8. EXTRACTOR FILES");

  const extractorDir = path.join(
    ROOT,
    "..",
    "services",
    "ai",
    "extractors"
  );

  if (fs.existsSync(extractorDir)) {
    const extractorFiles =
      fs.readdirSync(extractorDir);

    for (const file of extractorFiles) {
      if (!file.endsWith(".js")) continue;

      const filePath =
        path.join(extractorDir, file);

      console.log(
        `\n===== ${file} =====`
      );

      console.log(
        fs.readFileSync(
          filePath,
          "utf8"
        )
      );
    }
  }

  // ----------------------------------------------------------
  // PROCESSOR
  // ----------------------------------------------------------

  section("9. MEETING PROCESSOR");

  const processorCandidates = [
    path.join(
      ROOT,
      "..",
      "services",
      "ai",
      "processors",
      "meeting.processor.js"
    ),
    path.join(
      ROOT,
      "..",
      "services",
      "ai",
      "meeting.processor.js"
    )
  ];

  for (const file of processorCandidates) {
    if (fs.existsSync(file)) {
      console.log(
        `\n===== ${file} =====`
      );

      console.log(
        fs.readFileSync(
          file,
          "utf8"
        )
      );
    }
  }

  // ----------------------------------------------------------
  // HARDWARE INFORMATION
  // ----------------------------------------------------------

  section("10. HARDWARE INFORMATION");

  console.log(
    "Run this separately if needed:"
  );

  console.log(
    'nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv'
  );

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  section("11. PAPER EXPERIMENT SUMMARY");

  console.log(`
Dataset size:
  Meetings: ${meetingCount}
  Transcript words: ${totalWords}

Current extraction totals:
  Decisions: ${totalDecisions}
  Action items: ${totalActions}
  Risks: ${totalRisks}
  Unanswered questions: ${totalQuestions}

Benchmark:
  See extraction_accuracy.json above.

IMPORTANT:
This report is intended to identify the experimental evidence
needed for the research paper.
`);

  // ----------------------------------------------------------
  // SAVE MACHINE-READABLE REPORT
  // ----------------------------------------------------------

  const output = {
    generatedAt: new Date().toISOString(),

    system: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch
    },

    dataset: {
      meetings: meetingCount,
      transcriptWords: totalWords,
      transcriptCharacters: totalTranscriptChars
    },

    extractionTotals: {
      decisions: totalDecisions,
      actionItems: totalActions,
      risks: totalRisks,
      unansweredQuestions: totalQuestions
    },

    meetings: meetingStats
  };

  const outputFile = path.join(
    RESULTS_DIR,
    "paper_experiment_report.json"
  );

  fs.mkdirSync(
    RESULTS_DIR,
    { recursive: true }
  );

  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      output,
      null,
      2
    )
  );

  console.log(
    "\n[SAVED]",
    outputFile
  );

  await mongoose.disconnect();

  console.log("\nMongoDB disconnected.");
}

main().catch(err => {
  console.error("\nEXPERIMENT REPORT FAILED");
  console.error(err);
  process.exit(1);
});