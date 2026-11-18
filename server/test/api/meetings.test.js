const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, connect, disconnect, createUser, createMeeting, auth, Meeting } = require('../helpers');

describe('meetings API', () => {
  let U;
  before(async () => {
    await connect();
    U = await createUser();
  });
  after(disconnect);

  it('rejects an upload without a file', async () => {
    const res = await request(app).post('/api/meetings/upload').set(auth(U.token)).field('title', 'No file');
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'NO_FILE');
  });

  it('rejects an upload with a disallowed file type', async () => {
    const res = await request(app).post('/api/meetings/upload').set(auth(U.token))
      .field('title', 'Bad type')
      .attach('file', Buffer.from('not audio'), { filename: 'notes.txt', contentType: 'text/plain' });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'INVALID_FILE_TYPE');
  });

  it('exports action items as an .ics calendar file', async () => {
    const m = await createMeeting(U.user.id);
    const res = await request(app).get(`/api/meetings/${m._id}/calendar/ics`).set(auth(U.token));
    assert.equal(res.status, 200);
    assert.match(res.text, /BEGIN:VCALENDAR/);
  });

  describe('re-process', () => {
    it('validates the mode', async () => {
      const m = await createMeeting(U.user.id);
      const res = await request(app).post(`/api/meetings/${m._id}/reprocess`).set(auth(U.token)).send({ mode: 'everything' });
      assert.equal(res.status, 400);
    });

    it('refuses a full re-process when the recording file is gone', async () => {
      const m = await createMeeting(U.user.id, { filePath: '/definitely/missing.mp3' });
      const res = await request(app).post(`/api/meetings/${m._id}/reprocess`).set(auth(U.token)).send({ mode: 'full' });
      assert.equal(res.status, 409);
      const after = await Meeting.findById(m._id).lean();
      assert.equal(after.status, 'completed', 'a rejected request must not change the meeting');
    });

    it('refuses analysis re-runs when there is no transcript', async () => {
      const m = await createMeeting(U.user.id);
      await Meeting.updateOne({ _id: m._id }, { transcript: '' });
      const res = await request(app).post(`/api/meetings/${m._id}/reprocess`).set(auth(U.token)).send({ mode: 'analysis' });
      assert.equal(res.status, 409);
    });

    it('rejects an unsupported language code', async () => {
      const m = await createMeeting(U.user.id);
      const res = await request(app).post(`/api/meetings/${m._id}/reprocess`).set(auth(U.token))
        .send({ mode: 'full', language: 'klingon' });
      assert.equal(res.status, 400);
      const after = await Meeting.findById(m._id).lean();
      assert.equal(after.languageHint, '', 'a rejected request must not change the language');
    });

    it('returns 404 for a malformed meeting id', async () => {
      const res = await request(app).post('/api/meetings/not-an-id/reprocess').set(auth(U.token)).send({ mode: 'analysis' });
      assert.equal(res.status, 404);
    });
  });

  it('reports system status even when AI services are offline', async () => {
    const res = await request(app).get('/api/system/status').set(auth(U.token));
    assert.equal(res.status, 200);
    assert.equal(res.body.services.mongodb.available, true);
    for (const key of ['api', 'mongodb', 'qdrant', 'ollama', 'whisper']) {
      assert.ok(key in res.body.services, `missing ${key}`);
    }
  });
});
