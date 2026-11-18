const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, connect, disconnect, createUser, auth } = require('../helpers');

describe('auth', () => {
  before(connect);
  after(disconnect);

  it('registers, logs in and returns the profile', async () => {
    const u = await createUser('Alice');
    const login = await request(app).post('/api/auth/login').send({ email: u.email, password: u.password });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);

    const profile = await request(app).get('/api/auth/profile').set(auth(login.body.token));
    assert.equal(profile.status, 200);
    assert.equal(profile.body.user.email, u.email);
    assert.equal(profile.body.user.password, undefined, 'password hash must never be returned');
  });

  it('rejects a wrong password', async () => {
    const u = await createUser();
    const res = await request(app).post('/api/auth/login').send({ email: u.email, password: 'wrong-password' });
    assert.equal(res.status, 401);
  });

  it('rejects requests without a token or with a tampered token', async () => {
    assert.equal((await request(app).get('/api/auth/profile')).status, 401);
    assert.equal((await request(app).get('/api/meetings').set(auth('not.a.jwt'))).status, 401);
  });

  it('does not count profile checks against the login rate limit', async () => {
    // Regression: the auth limiter used to cover /api/auth/profile, which runs on
    // every page load, so users were logged out after ~20 page loads.
    const u = await createUser();
    for (let i = 0; i < 30; i++) {
      const res = await request(app).get('/api/auth/profile').set(auth(u.token));
      assert.equal(res.status, 200, `profile request ${i + 1} failed`);
      assert.equal(res.headers['ratelimit-limit'], undefined, 'profile must not be rate limited');
    }
  });
});
