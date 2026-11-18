# MeetingBuddy: Status and Next Improvements

**Date:** 18 November 2026
**Code state:** `main` at commit `2f13638` (pushed to GitHub)

This report has three parts: where the project stands today, what was changed in the November 2026 review, and what to build or research next. Effort is marked **S** (under a day), **M** (2–5 days) or **L** (1–3 weeks).

---

## 1. Current status

All core features work end to end. This was checked on 18 November 2026 with a real upload, an automated test of every API area and a page-by-page browser check.

| Area | Status | Notes |
|---|---|---|
| Sign-up, login, sessions | Working | JWT in an HTTP-only cookie; rate limit on login and register only |
| Upload → transcription | Working | faster-whisper `large-v3-turbo` on the RTX 3050 GPU (CUDA, float16); 45-second clip ≈ 51 s |
| AI analysis (9 stages) | Working | Qwen2.5-7B through Ollama; about 3–4 minutes per meeting on the 4 GB GPU |
| Embeddings and vector index | Working | `nomic-embed-text` with task prefixes; MongoDB and Qdrant in sync (92 chunks) |
| Search (keyword and hybrid) | Working | Hybrid search fuses passage-level keyword and vector results |
| RAG chat with citations | Working | 5 passages per question; about 15–25 s per answer |
| Dashboard, analytics, tasks, notifications | Working | Daily 8 AM reminder job; email only if SMTP is configured |
| Calendar export (.ics) | Working | Only for meetings that have action items |
| Settings / system status | Working (new) | Live status of MongoDB, Qdrant, Ollama and Whisper |
| Data isolation between users | Working | 12 of 12 cross-user checks pass |
| Speaker diarization | **Not working** | `torchcodec` can't load with FFmpeg 8; turned off in `.env` |
| Google / Outlook calendar sync | **Not connected** | Code exists in `services/calendar/`, but no route uses it |
| Automated tests | **Missing** | Only hand-run scripts; no `npm test`, no CI |

---

## 2. What was updated (November 2026 review)

### Security (commit `0a766d6`)
- Any logged-in user could read other users' meeting content through chat and search. Every search is now limited to the user's own meetings.
- The `/api/ai/*` routes required no login. They now do, and the whole module has since been removed (see below).
- Recordings in `/uploads` were publicly downloadable. They're now served only to their owner, through `GET /api/meetings/:id/media`.
- The server now exits on a crash instead of continuing in a broken state.

### Repository cleanup (commit `432e78e`)
- Paper, report and planning files moved into `docs/`.
- Backups, stray test scripts and the committed Python cache removed.
- `.gitignore`, README and the implementation status doc brought up to date.

### Retrieval, chat and app completion (commit `2f13638`)
- **Duplicate AI stack removed.** `src/modules/ai` (66 files, `/api/ai`) was never used by the frontend. It was tested side by side with the real chat and wasn't better.
- **Hybrid search fixed.** Results were merged by meeting, so each meeting contributed only one passage. They're now merged by passage, and keyword search works per passage through a MongoDB text index.
- **Embeddings fixed.** The Nomic task prefixes are now used, queries and documents go through the same provider, and the fake-vector fallback is gone.
- **Index rebuilt.** MongoDB and Qdrant were out of sync (8 vectors against 96 chunks). The reindex script is now a safe rebuild.
- **Benchmark fixed.** Recall and nDCG could exceed 1.0 (vector Recall@5 showed 2.91) because one meeting was counted several times.
- **Login bug fixed.** Users were signed out after about 20 page loads, because the login rate limit also counted profile checks.
- **Settings page built.** It replaces the "Coming soon" placeholder.
- **Faster, sturdier client.** Pages load on demand (first load 972 KB → 311 KB), an error boundary was added, and lint warnings dropped from 10 to 2.
- **Setup.** `docker-compose.yml` runs Qdrant with persistent storage; `server/requirements.txt` was added; the README setup steps were rewritten.

---

## 3. Fix first: known issues

| # | Issue | Why it matters | Effort |
|---|---|---|---|
| 1 | The "Tamil audio" meeting has a hallucinated English transcript (from an old pipeline run) | Wrong data shows up in chat, analytics and the paper | S: add a "Re-process meeting" button (see 4.1) and run it |
| 2 | Speaker diarization doesn't work (`torchcodec` vs FFmpeg 8) | Speaker labels power participant analytics and "who said what" | S–M: pass audio to pyannote as a waveform, or put FFmpeg 7 on the Python PATH |
| 3 | Google / Outlook calendar code isn't connected | The README advertises it | M: add OAuth routes and a "Connect calendar" button in Settings, or remove the claim from the README |
| 4 | `STT_PROVIDER=whisperx` in `.env` is never read; `services/transcription/providers/` is empty | Confusing for anyone reading the setup | S: remove it, or implement the provider switch |
| 5 | The client hard-codes `http://localhost:5000/api` | Breaks on any other host or port | S: use `import.meta.env.VITE_API_URL` and fall back to `/api` (the Vite proxy) |
| 6 | Transcription and analysis run inside the web server process, with no queue | Two uploads at once compete for the 4 GB GPU; a restart leaves meetings stuck at "transcribing" | M: add a job queue with a concurrency of 1 and recover stuck jobs at startup |
| 7 | The old `qdrant` Docker container is stopped but still exists | Disk clutter | S: `docker rm qdrant` |

---

## 4. New features

### 4.1 Meeting management
- **Re-process a meeting.** Re-run transcription, analysis or embeddings on an existing meeting. This is needed for #1 and whenever a model is upgraded. *(S–M)*
- **Edit a meeting.** Rename it, set the meeting type and date, and rename speakers ("SPEAKER_01" → "Priya"), with the change flowing into search and chat. *(M)*
- **Edit and confirm action items.** Change the owner and due date, and mark an item verified, so tasks don't rely only on the LLM's guess. *(M)*
- **Audio player synced to the transcript.** Clicking a line jumps the audio to that moment (the `/media` route already supports seeking). Chat citations would also jump to the exact moment. *(M)*
- **Export minutes.** Download a meeting's summary, decisions and action items as PDF or Word. *(M)*

### 4.2 Capture
- **Record in the browser.** Record directly in the app with the browser's recording API, instead of only uploading files. *(M)*
- **Live transcription.** Stream audio and show a running transcript during the meeting (faster-whisper in chunks). *(L)*
- **Import from Zoom, Google Meet or Teams.** Pull recordings and transcripts automatically. *(L)*

### 4.3 Chat and search
- **Show answers as they're written.** Ollama can send the answer word by word. Answers currently take 15–25 s with nothing on screen; streaming makes them feel much faster. *(S–M)*
- **Save chat history.** Keep conversations between sessions; the chat sidebar already has a place for them. *(M)*
- **Ask across a date range or meeting type.** Expose the existing filters in the chat UI, for example "decisions from last month's planning meetings". *(S)*
- **Follow-up suggestions.** After each answer, suggest 2–3 follow-up questions based on the retrieved passages. *(S)*

### 4.4 Collaboration
- **Teams and workspaces.** Share meetings with a team, with owner, editor and viewer roles. The `role` field already exists on users. *(L)*
- **Comments and highlights** on transcript lines. *(M)*
- **Email digests.** A weekly summary of open action items and decisions. The cron job and email sending already exist. *(S–M)*
- **Password reset and email verification.** Needed by any real user. *(M)*

---

## 5. AI and technical upgrades

| Upgrade | What it gives | Effort |
|---|---|---|
| **Re-ranker** after hybrid search (for example `bge-reranker-v2-m3`, run locally) | Better passage order before the answer is written; usually the biggest single quality gain in RAG | M |
| **Meeting context on each passage** (prepend title, date and speaker before embedding) | Questions such as "What was discussed in the Tamil audio?" currently fail because passages don't know which meeting they're from | S–M |
| **Multilingual embeddings** (`bge-m3` or `multilingual-e5`) | Tamil and Tamil–English (code-mixed) meetings become searchable; `nomic-embed-text` is English-only | M |
| **Language handling in transcription** | Detect Tamil and English per segment; optionally store an English translation next to the original | M |
| **Abstain when the answer isn't there** | A confidence score from retrieval, so the app says "not in your meetings" reliably instead of guessing | S–M |
| **Model options for small GPUs** | Offer `qwen2.5:3b` for speed and 7B for quality, selected in Settings; keep both models loaded so the embedding model doesn't swap the LLM out | M |
| **Long-meeting summarization** (map-reduce or hierarchical) | Meetings longer than about 1 hour exceed the context window | M |
| **Grounding check with a local NLI model** instead of word overlap | A more reliable check that every extracted item is supported by the transcript (already flagged in the paper) | M |

---

## 6. Engineering quality

- **Automated tests.** Use `node:test` or Jest with supertest for the API. Turn the existing manual checks (the end-to-end and isolation tests from the November review) into real tests, starting with "user A cannot read user B's meeting". *(M)*
- **CI with GitHub Actions.** Run lint, client build and API tests on every push. *(S)*
- **Full Docker Compose.** Add MongoDB, the server and the client next to Qdrant, so the whole system starts with one command. Ollama and the GPU can stay on the host. *(M)*
- **Check settings at startup.** Fail at boot if `JWT_SECRET`, `MONGO_URI` and similar are missing, instead of failing later. *(S)*
- **Structured logging** (pino) with a request ID; drop the emoji `console.log` lines. *(S–M)*
- **TypeScript or JSDoc types** for the API response shapes shared by client and server. *(L, optional)*
- **Accessibility pass.** Keyboard navigation, focus states and colour contrast (WCAG AA). *(M)*

---

## 7. Research track: journal publication

The paper is already honest about its gaps. These steps close them, most important first.

1. **More data.** Three meetings are too few: every method finds the right meeting within its top 3 results, so retrieval methods can't be told apart. Evaluate on public corpora:
   - **QMSum**: queries with the transcript spans that answer them, so passage-level relevance labels come almost for free;
   - **AMI** and **ICSI**: decisions, action items and summaries;
   - **MeetingBank**.

   Aim for 100 or more queries.
2. **Passage-level retrieval evaluation.** Compare keyword, vector, hybrid and hybrid with a re-ranker, plus prefixes on/off and chunk size. Report Recall@k, nDCG and MRR with significance tests (paired bootstrap or Wilcoxon).
3. **Clean ground truth.** Some current queries have no answer in any transcript (for example "cloud provider" and "security review"). Mark them as unanswerable and score correct refusals.
4. **Answer quality.** Measure faithfulness, context precision and citation accuracy, using an LLM judge validated against two human annotators (Cohen's κ).
5. **Novelty angle: Tamil–English meetings.** Measure Whisper's word error rate on Tamil, multilingual embeddings and cross-language retrieval. This is a gap in the literature and fits the Indian context.
6. **Extraction.** Two annotators per category, a single-prompt baseline, and a model-size comparison; re-run the parallel extraction experiment with the timeout fixed.
7. **Verified privacy.** Monitor network traffic during a full run to show that no meeting data leaves the machine.
8. **Reproducibility.** One script that regenerates every table and figure in the paper from the released code and data.

Candidate journals: IEEE Access, Expert Systems with Applications, Multimedia Tools and Applications.

---

## 8. Suggested order

| Phase | Focus | Items |
|---|---|---|
| 1 (1–2 weeks) | Close known gaps | Section 3 #1, #2, #5, #6; streaming chat; re-process button; tests and CI |
| 2 (2–3 weeks) | Better answers | Re-ranker, meeting context on passages, abstention, speaker renaming, audio-synced transcript |
| 3 (3–4 weeks) | Research evaluation | QMSum/AMI import, passage-level benchmark, answer-quality metrics, multilingual experiments |
| 4 (ongoing) | Product polish | Teams and sharing, in-browser recording, PDF export, calendar sync, full Docker Compose |
