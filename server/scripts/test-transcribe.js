const path = require('path');
const { transcribeFile, checkWhisperAvailability } = require('../services/transcriptionService');

async function test() {
  console.log('Testing Whisper availability...');
  const avail = await checkWhisperAvailability();
  console.log('Availability result:', avail);

  const testFile = path.join(__dirname, '../uploads/sample_test.mp3');
  const fs = require('fs');

  // Find any mp3/wav/m4a file in uploads directory to test
  const uploadsDir = path.join(__dirname, '../uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => /\.(mp3|wav|m4a|mp4|webm)$/i.test(f));

  if (files.length === 0) {
    console.log('No audio file found in uploads to test transcription.');
    return;
  }

  const samplePath = path.join(uploadsDir, files[0]);
  console.log(`Testing transcription on file: ${samplePath}`);

  try {
    const res = await transcribeFile(samplePath, { model: 'base' }, (pct) => {
      console.log(`Progress: ${pct.toFixed(1)}%`);
    });
    console.log('🎉 TRANSCRIPTION SUCCESS!');
    console.log(`Text preview: "${res.text.substring(0, 150)}..."`);
    console.log(`Word count: ${res.wordCount}, Language: ${res.language}, Duration: ${res.duration}s`);
  } catch (err) {
    console.error('❌ TRANSCRIPTION TEST FAILED:', err.message);
  }
}

test();
