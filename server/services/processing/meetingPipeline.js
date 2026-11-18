const fs = require('fs');
const Meeting = require('../../models/Meeting');
const { transcribeFile } = require('../transcriptionService');
const meetingProcessor = require('../ai/processors/meeting.processor');
const embeddingService = require('../embeddings/embedding.service');

/**
 * The meeting processing pipeline, split into restartable stages:
 *
 *   transcribe  audio -> transcript + segments        (Whisper, GPU)
 *   analyze     transcript -> structured AI analysis  (Ollama, GPU)
 *   embed       segments -> chunks in MongoDB + Qdrant (Ollama embeddings)
 *
 * Modes:
 *   'full'       transcribe -> analyze -> embed   (new uploads, re-transcription)
 *   'analysis'   analyze -> embed                 (re-run AI on the stored transcript)
 *   'embeddings' embed                            (rebuild the search index for one meeting)
 */
const MODES = {
  full: ['transcribe', 'analyze', 'embed'],
  analysis: ['analyze', 'embed'],
  embeddings: ['embed'],
};

const setStage = (meetingId, stage, extra = {}) =>
  Meeting.findByIdAndUpdate(meetingId, { processingStage: stage, ...extra });

async function transcribeStage(meeting) {
  const id = meeting._id;
  if (!meeting.filePath || !fs.existsSync(meeting.filePath)) {
    throw new Error('Original recording file is missing; cannot transcribe.');
  }
  await setStage(id, 'transcribing', {
    status: 'transcribing',
    transcriptionStatus: 'processing',
    transcriptionProgress: 0,
    transcriptionError: '',
  });

  let lastProgressTime = 0;
  const result = await transcribeFile(
    meeting.filePath,
    {
      diarize: process.env.ENABLE_DIARIZATION === 'true',
      // A user-chosen language beats auto-detection (see Meeting.languageHint).
      ...(meeting.languageHint ? { language: meeting.languageHint } : {}),
    },
    async (progress) => {
      const now = Date.now();
      if (now - lastProgressTime > 2000 || progress === 100) {
        lastProgressTime = now;
        await Meeting.findByIdAndUpdate(id, { transcriptionProgress: progress })
          .catch((err) => console.error('Failed to update progress in DB:', err.message));
      }
    }
  );

  const transcriptSegments = (result.segments || []).map((seg) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text,
    speaker: seg.speaker || 'Unknown',
  }));

  await Meeting.findByIdAndUpdate(id, {
    transcript: result.text,
    transcriptSegments,
    language: result.language,
    duration: result.duration,
    wordCount: result.wordCount,
    transcriptionStatus: 'completed',
    transcriptionProgress: 100,
    transcriptionCompletedAt: new Date(),
  });
  return { transcript: result.text, transcriptSegments };
}

async function analyzeStage(meetingId, transcript) {
  await setStage(meetingId, 'analyzing', { status: 'transcribing' });
  let aiAnalysis = {};
  try {
    aiAnalysis = await meetingProcessor.analyze(transcript);
  } catch (error) {
    // The transcript is still useful without analysis; record and continue.
    console.error(`[Pipeline] AI analysis failed for ${meetingId}:`, error.message);
  }
  await Meeting.findByIdAndUpdate(meetingId, { aiAnalysis });
}

async function embedStage(meetingId, transcript, transcriptSegments, meetingType) {
  await setStage(meetingId, 'embedding');
  try {
    await embeddingService.processMeetingEmbeddings(String(meetingId), transcript, {
      transcriptSegments,
      chunkType: 'Transcript',
      meetingType: meetingType || '',
    });
  } catch (error) {
    // Search/chat degrade, but the meeting itself is complete.
    console.error(`[Pipeline] Embedding failed for ${meetingId}:`, error.message);
  }
}

/**
 * Run a pipeline mode for one meeting. Never throws; failures are recorded
 * on the meeting document.
 */
async function runPipeline(meetingId, mode = 'full') {
  const stages = MODES[mode];
  if (!stages) throw new Error(`Unknown pipeline mode: ${mode}`);
  const started = Date.now();

  try {
    const meeting = await Meeting.findById(meetingId).lean();
    if (!meeting) return; // deleted while queued

    let transcript = meeting.transcript;
    let transcriptSegments = meeting.transcriptSegments || [];

    if (stages.includes('transcribe')) {
      ({ transcript, transcriptSegments } = await transcribeStage(meeting));
    } else if (!transcript) {
      throw new Error('Meeting has no transcript yet; run a full re-process instead.');
    }

    if (stages.includes('analyze')) {
      await analyzeStage(meetingId, transcript);
    }

    if (stages.includes('embed')) {
      const fresh = await Meeting.findById(meetingId).select('aiAnalysis.meetingType').lean();
      if (!fresh) return; // deleted mid-run: don't write chunks for a meeting that no longer exists
      await embedStage(meetingId, transcript, transcriptSegments, fresh.aiAnalysis && fresh.aiAnalysis.meetingType);
    }

    await setStage(meetingId, 'done', { status: 'completed', transcriptionError: '' });
    console.log(`[Pipeline] ${mode} finished for ${meetingId} in ${Math.round((Date.now() - started) / 1000)}s`);
  } catch (error) {
    console.error(`[Pipeline] ${mode} failed for ${meetingId}:`, error.message);
    const update = { processingStage: 'failed', transcriptionError: error.message };
    if (stages.includes('transcribe')) {
      update.status = 'failed';
      update.transcriptionStatus = 'failed';
    } else {
      // Analysis/embedding re-runs keep the existing transcript usable.
      update.status = 'completed';
    }
    await Meeting.findByIdAndUpdate(meetingId, update).catch(() => {});
  }
}

module.exports = { runPipeline, MODES };
