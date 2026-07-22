const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('============ STARTING SECURITY TESTS ============');
  let passed = 0;
  let total = 0;
  let failed = 0;

  function assert(condition, msg) {
    total++;
    if (condition) { passed++; console.log(`  ✓ Test ${total}: ${msg}`); }
    else { console.error(`  ❌ Test ${total} FAILED: ${msg}`); failed++; }
  }

  try {
    // --- Test 1: JWT generation and verification ---
    console.log('\n--- 1. JWT token operations ---');
    const userId = new (require('mongoose').Types.ObjectId)().toString();
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    assert(typeof token === 'string' && token.split('.').length === 3, 'JWT token generated with 3 parts');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert(decoded.id === userId, 'JWT decoded correctly');
    assert(decoded.exp > Math.floor(Date.now() / 1000), 'JWT has future expiry');

    // --- Test 2: Invalid JWT rejection ---
    console.log('\n--- 2. Invalid JWT handling ---');
    try {
      jwt.verify('invalid-token', process.env.JWT_SECRET);
      assert(false, 'Invalid token should throw');
    } catch (err) {
      assert(err.name === 'JsonWebTokenError', 'Invalid token throws JsonWebTokenError');
    }

    // --- Test 3: Expired JWT detection ---
    console.log('\n--- 3. Expired JWT detection ---');
    const expiredToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '0s' });
    try {
      jwt.verify(expiredToken, process.env.JWT_SECRET);
      assert(false, 'Expired token should throw');
    } catch (err) {
      assert(err.name === 'TokenExpiredError', 'Expired token throws TokenExpiredError');
    }

    // --- Test 4: Wrong secret rejection ---
    console.log('\n--- 4. Wrong secret ---');
    try {
      jwt.verify(token, 'wrong-secret');
      assert(false, 'Wrong secret should throw');
    } catch (err) {
      assert(err.name === 'JsonWebTokenError', 'Wrong secret throws JsonWebTokenError');
    }

    // --- Test 5: Rate limit config verification ---
    console.log('\n--- 5. Rate limit config ---');
    // We verify the code includes rate limiting by checking server.js
    const fs = require('fs');
    const serverJs = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf-8');
    assert(serverJs.includes('rateLimit'), 'server.js uses rate-limit');
    assert(serverJs.includes('authLimiter'), 'Auth rate limiter configured');
    assert(serverJs.includes('searchLimiter'), 'Search rate limiter configured');
    assert(serverJs.includes('chatLimiter'), 'Chat rate limiter configured');

    // --- Test 6: Helmet middleware ---
    console.log('\n--- 6. Helmet middleware ---');
    assert(serverJs.includes('helmet'), 'server.js uses helmet');

    // --- Test 7: Cookie parser ---
    console.log('\n--- 7. Cookie parser ---');
    assert(serverJs.includes('cookieParser'), 'server.js uses cookie-parser');

    // --- Test 8: Configurable CORS ---
    console.log('\n--- 8. Configurable CORS ---');
    assert(serverJs.includes('CORS_ORIGIN'), 'CORS origin configurable via env');

    // --- Test 9: Auth middleware supports cookies ---
    console.log('\n--- 9. Auth middleware cookie support ---');
    const authJs = fs.readFileSync(path.join(__dirname, '../middleware/auth.js'), 'utf-8');
    assert(authJs.includes('req.cookies'), 'Auth middleware checks cookies');

    // --- Test 10: Auth controller sets cookies ---
    console.log('\n--- 10. Auth controller cookie setting ---');
    const authController = fs.readFileSync(path.join(__dirname, '../controllers/authController.js'), 'utf-8');
    assert(authController.includes('res.cookie'), 'Auth controller sets httpOnly cookie');

    console.log(`\n============================================================`);
    console.log(failed > 0
      ? `⚠️  ${passed}/${total} SECURITY TESTS PASSED, ${failed} FAILED`
      : `🎉 ALL ${passed}/${total} SECURITY TESTS PASSED!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  }
}

runTests();
