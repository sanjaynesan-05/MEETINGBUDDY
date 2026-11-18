const fs = require('fs');
const Meeting = require('../../models/Meeting');
const { runPipeline, MODES } = require('./meetingPipeline');

/**
 * In-process FIFO queue for meeting processing.
 *
 * Whisper and the LLM share one GPU, so running several meetings at once
 * makes all of them slower (and can exhaust VRAM). Jobs therefore run with a
 * small concurrency limit (default 1, PROCESSING_CONCURRENCY to change).
 *
 * The queue lives in memory; on startup `recoverStuckMeetings()` re-queues
 * anything a previous process left half-done, so a restart never leaves a
 * meeting stuck at "transcribing".
 */
const CONCURRENCY = Math.max(1, parseInt(process.env.PROCESSING_CONCURRENCY, 10) || 1);

const pending = []; // [{ meetingId, mode }]
const active = new Map(); // meetingId -> mode

function position(meetingId) {
  const id = String(meetingId);
  if (active.has(id)) return 0;
  const i = pending.findIndex((j) => j.meetingId === id);
  return i === -1 ? -1 : i + 1;
}

function pump() {
  while (active.size < CONCURRENCY && pending.length > 0) {
    const job = pending.shift();
    active.set(job.meetingId, job.mode);
    runPipeline(job.meetingId, job.mode)
      .catch((err) => console.error('[JobQueue] Unexpected pipeline error:', err))
      .finally(() => {
        active.delete(job.meetingId);
        pump();
      });
  }
}

/**
 * Add a meeting to the queue. Returns false if the meeting is already queued
 * or running (duplicate requests are ignored).
 */
async function enqueue(meetingId, mode = 'full') {
  if (!MODES[mode]) throw new Error(`Unknown pipeline mode: ${mode}`);
  const id = String(meetingId);
  if (position(id) !== -1) return false;

  pending.push({ meetingId: id, mode });
  await Meeting.findByIdAndUpdate(id, {
    processingStage: 'queued',
    // Full runs show as "uploaded" (waiting); re-runs on a finished meeting
    // show as in progress so the UI polls for the result.
    status: mode === 'full' ? 'uploaded' : 'transcribing',
    ...(mode === 'full' ? { transcriptionStatus: 'pending' } : {}),
  }).catch(() => {});
  pump();
  return true;
}

function isBusy(meetingId) {
  return position(meetingId) !== -1;
}

function stats() {
  return { concurrency: CONCURRENCY, running: active.size, queued: pending.length };
}

/** Re-queue meetings left unfinished by a previous server process. */
async function recoverStuckMeetings() {
  const stuck = await Meeting.find({
    $or: [
      { status: { $in: ['uploaded', 'transcribing'] } },
      { processingStage: { $in: ['queued', 'transcribing', 'analyzing', 'embedding'] } },
    ],
  }).select('_id status transcript filePath processingStage').lean();

  let requeued = 0;
  for (const m of stuck) {
    const hasTranscript = !!(m.transcript && m.transcript.trim());
    let mode = 'full';
    if (hasTranscript && m.processingStage === 'embedding') mode = 'embeddings';
    else if (hasTranscript && m.processingStage === 'analyzing') mode = 'analysis';

    if (mode === 'full' && (!m.filePath || !fs.existsSync(m.filePath))) {
      await Meeting.findByIdAndUpdate(m._id, {
        status: 'failed',
        transcriptionStatus: 'failed',
        processingStage: 'failed',
        transcriptionError: 'Processing was interrupted and the recording file is missing.',
      });
      continue;
    }
    if (await enqueue(m._id, mode)) requeued++;
  }
  if (stuck.length) console.log(`[JobQueue] Recovered ${requeued} interrupted meeting(s) of ${stuck.length} found`);
  return requeued;
}

module.exports = { enqueue, isBusy, position, stats, recoverStuckMeetings };
