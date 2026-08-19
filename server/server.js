const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { checkHealth: checkQdrantHealth, QDRANT_ENABLED } = require('./services/embeddings/qdrantStorage');

dotenv.config();

const app = express();

connectDB();

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception:', err);
});

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
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many search requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many chat requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/auth', authLimiter);
app.use('/api/search', searchLimiter);
app.use('/api/chat', chatLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/ai', require('./src/modules/ai/routes/ai.routes'));
app.use('/api/analytics', require('./routes/analytics.routes.js'));
app.use('/api/search', require('./routes/search.routes.js'));
app.use('/api/chat', require('./routes/chat.routes.js'));
app.use('/api', require('./routes/calendar.routes.js'));
app.use('/api/notifications', require('./routes/notification.routes.js'));
app.use('/api/tasks', require('./routes/tasks.routes.js'));

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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  });

  // Non-blocking startup Qdrant health check
  setImmediate(async () => {
    try {
      if (!QDRANT_ENABLED) {
        console.log('[Qdrant] QDRANT_ENABLED is false — vector search disabled');
        return;
      }
      const health = await checkQdrantHealth();
      if (health.available) {
        console.log(`[Qdrant] Connected to ${health.collection} (dim=${health.vectorDimension}, exists=${health.collectionExists})`);
        if (health.dimensionMismatch) {
          console.warn(`[Qdrant] WARNING: Vector dimension mismatch — vector search may return poor results`);
        }
      } else {
        console.warn(`[Qdrant] UNAVAILABLE — vector search disabled. Reason: ${health.reason}`);
        console.warn('[Qdrant] RAG will fall back to keyword search and MongoDB. Start Qdrant for full vector search.');
      }
    } catch (err) {
      console.warn('[Qdrant] Health check failed during startup:', err.message);
    }
  });
};

startServer();
