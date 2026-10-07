require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const os = require('os');
const { execSync } = require('child_process');

(async () => {
  const info = {
    os: {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model,
      totalMemGB: Math.round(os.totalmem() / (1024 ** 3)),
      freeMemGB: Math.round(os.freemem() / (1024 ** 3)),
    },
    node: process.version,
    env: {
      whisperModel: process.env.WHISPER_MODEL,
      ollamaModel: process.env.OLLAMA_MODEL || process.env.MODEL_NAME,
      embeddingModel: process.env.EMBEDDING_MODEL,
      embeddingDimension: process.env.EMBEDDING_DIMENSION,
      gpuEnabled: process.env.GPU_ENABLED,
      qdrantEnabled: process.env.QDRANT_ENABLED,
      maxContext: process.env.MAX_CONTEXT,
      maxContextCharacters: process.env.MAX_CONTEXT_CHARACTERS,
      maxRetries: process.env.MAX_RETRIES,
      temperature: process.env.TEMPERATURE,
    },
  };

  // Check Python & faster-whisper
  try {
    const pyVersion = execSync(`"${process.env.PYTHON_PATH || 'python'}" --version`, { encoding: 'utf8' }).trim();
    info.python = pyVersion;
  } catch (e) {
    info.python = 'NOT FOUND';
  }

  // Check faster-whisper version
  try {
    const fwVersion = execSync(
      `"${process.env.PYTHON_PATH || 'python'}" -c "import faster_whisper; print(faster_whisper.__version__)"`,
      { encoding: 'utf8' }
    ).trim();
    info.fasterWhisper = fwVersion;
  } catch (e) {
    try {
      const fwVersion = execSync(`python -c "import faster_whisper; print(faster_whisper.__version__)"`, { encoding: 'utf8' }).trim();
      info.fasterWhisper = fwVersion;
    } catch (e2) {
      info.fasterWhisper = 'NOT INSTALLED';
    }
  }

  // Check ctranslate2 version
  try {
    const ct2Version = execSync(
      `"${process.env.PYTHON_PATH || 'python'}" -c "import ctranslate2; print(ctranslate2.__version__)"`,
      { encoding: 'utf8' }
    ).trim();
    info.ctranslate2 = ct2Version;
  } catch (e) {
    info.ctranslate2 = 'NOT INSTALLED';
  }

  // Check torch CUDA availability
  try {
    const cudaInfo = execSync(
      `"${process.env.PYTHON_PATH || 'python'}" -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'no-gpu'); print(torch.version.cuda or 'no-cuda')"`,
      { encoding: 'utf8' }
    ).trim();
    const lines = cudaInfo.split('\n');
    info.torch = { cudaAvailable: lines[0], gpuName: lines[1], cudaVersion: lines[2] };
  } catch (e) {
    info.torch = { error: e.message };
  }

  // Check pyannote for diarization
  try {
    const pyannote = execSync(
      `"${process.env.PYTHON_PATH || 'python'}" -c "import pyannote.audio; print(pyannote.audio.__version__)"`,
      { encoding: 'utf8' }
    ).trim();
    info.pyannote = pyannote;
  } catch (e) {
    info.pyannote = 'NOT INSTALLED';
  }

  // Check available Ollama models
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    info.ollamaModels = data.models?.map(m => ({ name: m.name, sizeMB: Math.round(m.size / 1024 / 1024) }));
  } catch (e) {
    info.ollamaModels = 'OLLAMA NOT RUNNING';
  }

  // Check MongoDB
  const mongoose = require('mongoose');
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    const db = mongoose.connection.db;
    info.mongoConnected = true;
    info.mongoCollections = (await db.listCollections().toArray()).map(c => c.name);
    await mongoose.disconnect();
  } catch (e) {
    info.mongoConnected = false;
  }

  // Check Qdrant
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 3000);
    const qr = await fetch(process.env.QDRANT_URL || 'http://localhost:6333', { signal: c.signal });
    clearTimeout(t);
    info.qdrantConnected = qr.ok;
  } catch (e) {
    info.qdrantConnected = false;
  }

  console.log(JSON.stringify(info, null, 2));
  process.exit(0);
})();