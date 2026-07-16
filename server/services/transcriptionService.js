const { spawn, execFile } = require('child_process');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'transcribe.py');
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    console.log(`⚡ Running: python ${args.join(' ')}`);
    const startTime = Date.now();

    const pythonProcess = spawn('python', args);

    let stdoutData = '';
    let stderrData = '';
    
    // Timer for timeout
    const timeoutId = setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      reject(new Error(`Transcription timed out after ${TIMEOUT_MS / 1000}s.`));
    }, TIMEOUT_MS);

    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString('utf-8');
      
      // Look for progress lines e.g. "PROGRESS: 45.2"
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('PROGRESS:')) {
          const percent = parseFloat(line.split(':')[1].trim());
          if (!isNaN(percent)) {
            // Log to terminal backend logs as requested
            console.log(`[Meeting Processing] Transcription Progress: ${percent.toFixed(1)}%`);
            if (onProgress) onProgress(percent);
          }
        } else if (line.trim().length > 0) {
          stdoutData += line + '\n';
        }
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString('utf-8');
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (code !== 0) {
        return reject(new Error(`Whisper process error (${elapsed}s) with code ${code}. Stderr: ${stderrData || 'none'}`));
      }

      try {
        // Find the JSON block in the stdout data
        // We look for the last line that starts with { and ends with }
        const outputLines = stdoutData.trim().split('\n');
        let jsonStr = null;
        for (let i = outputLines.length - 1; i >= 0; i--) {
          const line = outputLines[i].trim();
          if (line.startsWith('{') && line.endsWith('}')) {
            jsonStr = line;
            break;
          }
        }

        if (!jsonStr) {
          throw new Error('Could not find JSON output in python script response.');
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
        });
      } catch (parseError) {
        reject(new Error(`Failed to parse Whisper output: ${stdoutData.substring(0, 500)}`));
      }
    });
    
    pythonProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to start subprocess: ${err.message}`));
    });
  });
};

const transcribeFile = async (filePath, options = {}, onProgress = null) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      console.log(`📝 Transcription attempt ${attempt}/${MAX_RETRIES + 1} for: ${path.basename(filePath)}`);
      const result = await runWhisper(filePath, options, onProgress);
      console.log(`✅ Transcription completed: ${result.wordCount} words, language: ${result.language}`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Transcription attempt ${attempt} failed: ${error.message}`);

      if (attempt <= MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * attempt;
        console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
        await delay(waitTime);
      }
    }
  }

  throw lastError;
};

const checkWhisperAvailability = () => {
  return new Promise((resolve) => {
    execFile('python', ['--version'], { timeout: 5000 }, (error, stdout) => {
      if (error) {
        return resolve({
          available: false,
          message: 'Python is not installed or not in PATH.',
        });
      }

      execFile(
        'python',
        ['-c', 'try:\n from faster_whisper import WhisperModel; print("faster-whisper")\nexcept:\n import whisper; print(f"openai-whisper {whisper.__version__}")'],
        { timeout: 10000 },
        (err, out) => {
          if (err) {
            return resolve({
              available: false,
              message: 'Neither faster-whisper nor openai-whisper is installed. Run: pip install faster-whisper',
            });
          }

          resolve({
            available: true,
            message: `${out.trim()} is available. Python: ${stdout.trim()}`,
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
