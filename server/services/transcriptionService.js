const { spawn, execFile, execFileSync } = require('child_process');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'transcribe.py');

const TIMEOUT_MS = parseInt(process.env.TRANSCRIPTION_TIMEOUT_MS || '600000', 10);
const INITIAL_TIMEOUT_MS = parseInt(process.env.TRANSCRIPTION_INITIAL_TIMEOUT_MS || '120000', 10);
const STALL_TIMEOUT_MS = parseInt(process.env.TRANSCRIPTION_STALL_TIMEOUT_MS || '90000', 10);
const MAX_RETRIES = parseInt(process.env.STT_MAX_RETRIES || '2', 10);
const RETRY_DELAY_MS = parseInt(process.env.STT_RETRY_DELAY_MS || '2000', 10);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Kill a process and its entire process tree.
 * On Windows, uses taskkill /t /f; on Unix, kills the process group.
 */
function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/pid', pid, '/t', '/f'], { stdio: 'ignore' });
    } else {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch (_) {
        process.kill(pid, 'SIGKILL');
      }
    }
  } catch (e) {
    // Process may have already exited — safe to ignore
  }
}

/**
 * Classify whether an error is permanent (do NOT retry) or transient.
 */
function isPermanentError(errorMessage) {
  const msg = (errorMessage || '').toLowerCase();
  const permanentPatterns = [
    'missing',
    'not installed',
    'not found',
    'invalid',
    'no module',
    'cannot find',
    'does not exist',
    'is a directory',
    'malformed arguments',
    'cuda configuration',
    'could not find',
    'configuration',
  ];
  return permanentPatterns.some((p) => msg.includes(p));
}

/**
 * Execute the Python whisper transcription script using spawn to capture progress
 * @param {string} filePath - Absolute path to the audio/video file
 * @param {object} options - Whisper options
 * @param {function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<{text: string, language: string, duration: number, wordCount: number}>}
 */
const runWhisper = (filePath, options = {}, onProgress = null) => {
  return new Promise((resolve, reject) => {
    const model = options.model || process.env.WHISPER_MODEL || 'base';
    const language = options.language || process.env.WHISPER_LANGUAGE || null;

    const args = [SCRIPT_PATH, filePath, '--model', model];
    if (language) {
      args.push('--language', language);
    }
    if (options.diarize) {
      args.push('--diarize');
      const hfToken = process.env.HF_TOKEN;
      if (hfToken) {
        args.push('--hf-token', hfToken);
      }
    }

    const pythonExe = process.env.PYTHON_PATH || 'python';
    console.log(`⚡ Running: ${pythonExe} ${args.join(' ')}`);
    const startTime = Date.now();

    const pythonProcess = spawn(pythonExe, args, {
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdoutData = '';
    let stderrData = '';
    let lastProgress = -1;
    let lastOutputTime = Date.now();
    let hasReceivedOutput = false;

    // Overall timeout — hard limit regardless of progress
    const timeoutId = setTimeout(() => {
      console.error(`[TranscriptionService] Overall timeout (${TIMEOUT_MS / 1000}s) reached. Last progress: ${lastProgress}%`);
      killProcessTree(pythonProcess.pid);
      reject(new Error(`Transcription timed out after ${TIMEOUT_MS / 1000}s. Last progress: ${lastProgress >= 0 ? lastProgress.toFixed(1) + '%' : 'no progress reported'}`));
    }, TIMEOUT_MS);

    // Stall timeout — no output at all (progress, status, or diagnostics) for STALL_TIMEOUT_MS
    const stallTimerId = setInterval(() => {
      const elapsedSinceLastOutput = Date.now() - lastOutputTime;
      if (hasReceivedOutput && elapsedSinceLastOutput > STALL_TIMEOUT_MS) {
        console.error(`[TranscriptionService] Stall detected: no output for ${STALL_TIMEOUT_MS / 1000}s. Last progress: ${lastProgress}%`);
        killProcessTree(pythonProcess.pid);
        clearTimeout(timeoutId);
        clearInterval(stallTimerId);
        reject(new Error(`Transcription stalled (no output for ${STALL_TIMEOUT_MS / 1000}s). Last progress: ${lastProgress >= 0 ? lastProgress.toFixed(1) + '%' : 'no progress'}`));
      }
    }, 5000);

    // Initial timeout — no output at all within INITIAL_TIMEOUT_MS (model loading phase)
    const initialTimerId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (!hasReceivedOutput && elapsed > INITIAL_TIMEOUT_MS) {
        console.error(`[TranscriptionService] Initial timeout: no output for ${INITIAL_TIMEOUT_MS / 1000}s during model loading.`);
        killProcessTree(pythonProcess.pid);
        clearTimeout(timeoutId);
        clearInterval(stallTimerId);
        clearInterval(initialTimerId);
        reject(new Error(`Transcription initialisation timed out (no output for ${INITIAL_TIMEOUT_MS / 1000}s)`));
      }
    }, 5000);

    let lineBuffer = '';
    pythonProcess.stdout.on('data', (data) => {
      lineBuffer += data.toString('utf-8');

      let newlineIdx;
      while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
        const line = lineBuffer.slice(0, newlineIdx).trim();
        lineBuffer = lineBuffer.slice(newlineIdx + 1);

        lastOutputTime = Date.now();
        hasReceivedOutput = true;

        if (line.startsWith('PROGRESS:')) {
          const percent = parseFloat(line.substring(9).trim());
          if (!isNaN(percent)) {
            const clamped = Math.max(0, Math.min(100, percent));
            if (clamped !== lastProgress) {
              lastProgress = clamped;
              console.log(`[WhisperX] Progress: ${clamped.toFixed(1)}%`);
              if (onProgress) onProgress(clamped);
            }
          }
          continue;
        }

        if (line.startsWith('STATUS:')) {
          console.log(`[WhisperX] Status: ${line.substring(8).trim()}`);
          continue;
        }

        if (line.startsWith('DIAGNOSTICS:')) {
          console.log(`[WhisperX] ${line.substring(13)}`);
          continue;
        }

        if (line.startsWith('{')) {
          stdoutData += line + '\n';
        } else if (line.trim().length > 0) {
          stdoutData += line + '\n';
        }
      }
    });

    pythonProcess.stdout.on('end', () => {
      if (lineBuffer.trim().length > 0) {
        stdoutData += lineBuffer;
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString('utf-8');
      lastOutputTime = Date.now();
      hasReceivedOutput = true;
    });

    pythonProcess.on('close', (code, signal) => {
      clearTimeout(timeoutId);
      clearInterval(stallTimerId);
      clearInterval(initialTimerId);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (signal) {
        console.error(`[TranscriptionService] Process terminated by signal: ${signal} after ${elapsed}s. Last progress: ${lastProgress}%`);
        return reject(new Error(`Transcription process was terminated (${signal}). Last progress: ${lastProgress >= 0 ? lastProgress.toFixed(1) + '%' : 'no progress'}`));
      }

      if (code !== 0) {
        const stderrPreview = stderrData ? stderrData.substring(0, 500) : 'none';
        return reject(new Error(`Whisper process error (${elapsed}s) exit code ${code}. Stderr: ${stderrPreview}`));
      }

      try {
        let jsonStr = null;
        const startIdx = stdoutData.indexOf('{');
        const endIdx = stdoutData.lastIndexOf('}');

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          jsonStr = stdoutData.substring(startIdx, endIdx + 1);
        }

        if (!jsonStr) {
          throw new Error('Could not find valid JSON object in python script output.');
        }

        const result = JSON.parse(jsonStr);

        if (!result.success) {
          return reject(new Error(result.error || 'Transcription failed with unknown error.'));
        }

        console.log(`⚡ Engine: ${result.engine || 'unknown'} | Processing: ${result.processingTime || elapsed}s`);

        resolve({
          text: result.text,
          language: result.language,
          duration: result.duration,
          wordCount: result.wordCount,
          segments: result.segments || null,
          speakers: result.speakers || null,
        });
      } catch (parseError) {
        reject(new Error(`Failed to parse Whisper output: ${stdoutData.substring(0, 500)}`));
      }
    });

    pythonProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      clearInterval(stallTimerId);
      clearInterval(initialTimerId);
      reject(new Error(`Failed to start subprocess: ${err.message}`));
    });
  });
};

const transcribeFile = async (filePath, options = {}, onProgress = null) => {
  let lastError;
  const maxAttempts = MAX_RETRIES + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📝 Transcription attempt ${attempt}/${maxAttempts} for: ${path.basename(filePath)}`);
      const result = await runWhisper(filePath, options, onProgress);
      console.log(`✅ Transcription completed: ${result.wordCount} words, language: ${result.language}`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Transcription attempt ${attempt} failed: ${error.message}`);

      if (isPermanentError(error.message)) {
        console.log(`[TranscriptionService] Permanent error detected — not retrying.`);
        throw error;
      }

      if (attempt < maxAttempts) {
        const waitTime = RETRY_DELAY_MS * attempt;
        console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
        await delay(waitTime);
      }
    }
  }

  throw lastError;
};

const checkWhisperAvailability = () => {
  const pythonExe = process.env.PYTHON_PATH || 'python';
  return new Promise((resolve) => {
    execFile(pythonExe, ['--version'], { timeout: 5000 }, (error, stdout) => {
      if (error) {
        return resolve({
          available: false,
          message: 'Python is not installed or not in PATH.',
        });
      }

      const pythonVersion = stdout.trim() || 'unknown';

      execFile(
        pythonExe,
        ['-c', 'try:\n from faster_whisper import WhisperModel; print("faster-whisper")\nexcept ImportError:\n print("not-installed")'],
        { timeout: 10000 },
        (err, out) => {
          if (err) {
            return resolve({
              available: false,
              message: 'Unable to check Whisper installation.',
              pythonVersion,
            });
          }

          const result = out.trim();
          if (result.startsWith('not-installed')) {
            return resolve({
              available: false,
              message: 'Neither faster-whisper nor openai-whisper is installed. Run: pip install faster-whisper',
              pythonVersion,
            });
          }

          resolve({
            available: true,
            message: `${result} is available`,
            pythonVersion,
          });
        }
      );
    });
  });
};

module.exports = {
  transcribeFile,
  checkWhisperAvailability,
};
