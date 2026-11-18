// Express application: middleware and routes only.
// Starting the HTTP server, connecting to MongoDB and process-level handlers
// live in server.js, so tests can import this app without side effects.
require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();

// Security middleware
app.use(helmet());
app.use(cookieParser());

// Configurable CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin.split(',').map(s => s.trim()),
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiters
const limit = (name, fallback) => parseInt(process.env[name], 10) || fallback;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: limit('AUTH_RATE_LIMIT_MAX', 20),
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: limit('SEARCH_RATE_LIMIT_MAX', 60),
  message: { success: false, message: 'Too many search requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: limit('CHAT_RATE_LIMIT_MAX', 30),
  message: { success: false, message: 'Too many chat requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
// Brute-force protection applies to credential endpoints only. The profile
// check runs on every page load and must not count against this budget.
app.use(['/api/auth/login', '/api/auth/register'], authLimiter);
app.use('/api/search', searchLimiter);
app.use('/api/chat', chatLimiter);

// NOTE: uploaded recordings are intentionally NOT served statically —
// meeting audio is private and must only be reachable through authenticated,
// ownership-checked routes (see GET /api/meetings/:id/media).

// Public health check — must be registered BEFORE any protected /api prefix middleware
app.get('/api/health', async (req, res) => {
  const { checkWhisperAvailability } = require('./services/transcriptionService');
  const whisperStatus = await checkWhisperAvailability();

  res.status(200).json({
    success: true,
    message: 'AI Meeting Intelligence API is running.',
    timestamp: new Date().toISOString(),
    whisper: whisperStatus,
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/analytics', require('./routes/analytics.routes.js'));
app.use('/api/search', require('./routes/search.routes.js'));
app.use('/api/chat', require('./routes/chat.routes.js'));
app.use('/api', require('./routes/calendar.routes.js'));
app.use('/api/notifications', require('./routes/notification.routes.js'));
app.use('/api/tasks', require('./routes/tasks.routes.js'));
app.use('/api/system', require('./routes/system.routes.js'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

module.exports = app;
