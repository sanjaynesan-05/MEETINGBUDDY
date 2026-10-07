require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB: CONNECTED');
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name).join(', '));
    const meetings = await db.collection('meetings').countDocuments();
    console.log('meetings total:', meetings);
    const withTranscripts = await db.collection('meetings').countDocuments({ transcript: { $ne: '' } });
    console.log('meetings_with_transcripts:', withTranscripts);
    const completed = await db.collection('meetings').countDocuments({ status: 'completed' });
    console.log('meetings_completed:', completed);
    const chunks = await db.collection('meetingchunks').countDocuments();
    console.log('meetingchunks:', chunks);
    const users = await db.collection('users').countDocuments();
    console.log('users:', users);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.log('MongoDB ERROR:', e.message);
    process.exit(1);
  }
})();