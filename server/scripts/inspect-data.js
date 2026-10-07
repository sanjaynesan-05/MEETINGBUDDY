require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const meetings = await db.collection('meetings').find({}).sort({ createdAt: -1 }).toArray();
    console.log(`\n=== MEETINGS (${meetings.length}) ===`);
    for (const m of meetings) {
      console.log(`\n--- Meeting: ${m.title} ---`);
      console.log(`  _id: ${m._id}`);
      console.log(`  status: ${m.status}, transcriptionStatus: ${m.transcriptionStatus}, embeddingStatus: ${m.embeddingStatus}`);
      console.log(`  duration: ${m.duration}s, wordCount: ${m.wordCount}`);
      console.log(`  createdAt: ${m.createdAt}`);
      console.log(`  language: ${m.language}`);
      const t = m.transcript || '';
      console.log(`  transcript length: ${t.length} chars`);
      console.log(`  transcript preview: "${t.substring(0, 200)}..."`);
      console.log(`  transcriptSegments: ${(m.transcriptSegments || []).length}`);
      
      if (m.aiAnalysis) {
        console.log(`  aiAnalysis keys: ${Object.keys(m.aiAnalysis).join(', ')}`);
        console.log(`  meetingType: ${m.aiAnalysis.meetingType || 'N/A'}`);
        console.log(`  decisions: ${(m.aiAnalysis.decisions || []).length}`);
        console.log(`  actionItems: ${(m.aiAnalysis.actionItems || []).length}`);
        console.log(`  risks: ${(m.aiAnalysis.risks || []).length}`);
        console.log(`  summary length: ${(m.aiAnalysis.summary || '').length}`);
        const d = m.aiAnalysis.decisions || [];
        if (d.length > 0) console.log(`  decisions preview: ${JSON.stringify(d.slice(0, 2))}`);
        const a = m.aiAnalysis.actionItems || [];
        if (a.length > 0) console.log(`  actionItems preview: ${JSON.stringify(a.slice(0, 2))}`);
      }
    }
    
    // Check chunks: how many per meeting, dimensions
    console.log(`\n=== CHUNKS ===`);
    const chunkStats = await db.collection('meetingchunks').aggregate([
      { $group: { _id: '$meetingId', count: { $sum: 1 }, avgLen: { $avg: { $strLenCP: '$text' } } } }
    ]).toArray();
    for (const cs of chunkStats) {
      console.log(`  meetingId: ${cs._id}, chunks: ${cs.count}, avgLen: ${Math.round(cs.avgLen)}`);
    }
    
    const sampleChunk = await db.collection('meetingchunks').findOne({});
    if (sampleChunk) {
      console.log(`\n  sample chunk embedding dimensions: ${(sampleChunk.embedding?.vector || []).length}`);
      console.log(`  sample chunk provider: ${sampleChunk.embedding?.provider}`);
      console.log(`  sample chunk model: ${sampleChunk.embedding?.model}`);
    }
    
    // Check conversations
    const conversations = await db.collection('conversations').countDocuments();
    console.log(`\n=== CONVERSATIONS: ${conversations} ===`);
    const convSample = await db.collection('conversations').findOne({});
    if (convSample) {
      console.log(`  sample conversation keys: ${Object.keys(convSample).join(', ')}`);
      if (convSample.messages) {
        console.log(`  messages: ${convSample.messages.length}`);
        console.log(`  first message: ${JSON.stringify(convSample.messages[0] || {}).substring(0, 300)}`);
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.log('ERROR:', e.message);
    process.exit(1);
  }
})();