const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, connect, disconnect, createUser, createMeeting, auth } = require('../helpers');

// User A owns a meeting. User B must not be able to reach it through any route.
describe('cross-user data isolation', () => {
  let A;
  let B;
  let meeting;

  before(async () => {
    await connect();
    A = await createUser('Owner A');
    B = await createUser('Other B');
    meeting = await createMeeting(A.user.id, { title: 'Confidential billing migration' });
  });
  after(disconnect);

  it('lists only your own meetings', async () => {
    const a = await request(app).get('/api/meetings').set(auth(A.token));
    const b = await request(app).get('/api/meetings').set(auth(B.token));
    assert.equal(a.status, 200);
    assert.equal(JSON.stringify(a.body).includes(String(meeting._id)), true);
    assert.equal(JSON.stringify(b.body).includes(String(meeting._id)), false);
  });

  for (const path of ['', '/transcript', '/analysis', '/media', '/calendar/ics']) {
    it(`blocks GET /api/meetings/:id${path} for another user`, async () => {
      const res = await request(app).get(`/api/meetings/${meeting._id}${path}`).set(auth(B.token));
      assert.equal(res.status, 404);
    });
  }

  it('blocks re-processing and deleting another user\'s meeting', async () => {
    const re = await request(app).post(`/api/meetings/${meeting._id}/reprocess`).set(auth(B.token)).send({ mode: 'analysis' });
    assert.equal(re.status, 404);
    const del = await request(app).delete(`/api/meetings/${meeting._id}`).set(auth(B.token));
    assert.equal(del.status, 404);
  });

  it('keyword and hybrid search only return your own meetings', async () => {
    for (const url of ['/api/search?q=billing', '/api/search/hybrid?q=billing%20rollout%20plan']) {
      const a = await request(app).get(url).set(auth(A.token));
      const b = await request(app).get(url).set(auth(B.token));
      assert.equal(a.status, 200, url);
      assert.equal(JSON.stringify(a.body).includes(String(meeting._id)), true, `owner should find it via ${url}`);
      assert.equal(JSON.stringify(b.body).includes(String(meeting._id)), false, `other user must not see it via ${url}`);
    }
  });

  it('chat gives another user no context from your meetings', async () => {
    const res = await request(app).post('/api/chat').set(auth(B.token))
      .send({ question: 'Who owns the rollout plan?', meetingId: String(meeting._id) });
    assert.equal(res.status, 200);
    assert.equal(res.body.metadata.chunksUsed, 0);
    assert.deepEqual(res.body.citations, []);
  });

  it('streaming chat gives another user no context either', async () => {
    const res = await request(app).post('/api/chat/stream').set(auth(B.token))
      .send({ question: 'Who owns the rollout plan?' })
      .buffer(true).parse((r, cb) => { let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => cb(null, d)); });
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/event-stream/);
    const events = res.body.split('\n\n').filter(Boolean).map((e) => JSON.parse(e.replace(/^data: /, '')));
    const context = events.find((e) => e.type === 'context');
    const done = events.find((e) => e.type === 'done');
    assert.equal(context.chunksUsed, 0);
    assert.ok(done, 'stream must end with a done event');
    assert.deepEqual(done.citations, []);
  });

  it('does not serve uploads publicly', async () => {
    const res = await request(app).get('/uploads/audio.mp3');
    assert.equal(res.status, 404);
  });

  it('the removed /api/ai module is not reachable', async () => {
    const res = await request(app).post('/api/ai/retrieve').set(auth(A.token)).send({ question: 'x' });
    assert.equal(res.status, 404);
  });
});
