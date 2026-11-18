require('dotenv').config({ quiet: true });

const connectDB = require('./config/db');
const app = require('./app');
const { checkHealth: checkQdrantHealth, QDRANT_ENABLED } = require('./services/embeddings/qdrantStorage');

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  // After an uncaught exception the process is in an undefined state.
  // Log and exit so a process manager (nodemon/pm2/docker) restarts it cleanly.
  console.error('⚠️  Uncaught Exception — shutting down:', err);
  process.exit(1);
});

connectDB();

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
