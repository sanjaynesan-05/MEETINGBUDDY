const { QdrantClient } = require('@qdrant/js-client-rest');
const dotenv = require('dotenv');

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_ENABLED = process.env.QDRANT_ENABLED !== 'false';
const QDRANT_TIMEOUT_MS = parseInt(process.env.QDRANT_TIMEOUT_MS || '5000', 10);

let qdrantClient;
let _health = { available: false, checked: false };

try {
  qdrantClient = new QdrantClient({ url: QDRANT_URL });
} catch (e) {
  console.error('[Qdrant] Failed to initialise client:', e.message);
  qdrantClient = null;
}

async function checkQdrantHealth() {
  if (typeof qdrantClient === 'undefined' || qdrantClient === null) {
    return { available: false, reason: 'client not initialised' };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), QDRANT_TIMEOUT_MS);
    const response = await qdrantClient.getCollections({ signal: controller.signal });
    clearTimeout(timeoutId);
    return { available: true, collections: response.collections || [] };
  } catch (error) {
    return { available: false, reason: error.message || 'fetch failed' };
  }
}

module.exports = { qdrantClient, QDRANT_URL, QDRANT_ENABLED, QDRANT_TIMEOUT_MS, checkQdrantHealth };
