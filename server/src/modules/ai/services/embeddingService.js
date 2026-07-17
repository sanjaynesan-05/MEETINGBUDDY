const config = require('../config/embeddingConfig');
const { validateEmbedding } = require('../utils/embeddingValidator');

// Simple in-memory request-level cache to prevent duplicate generations
const cache = new Map();

const generateEmbedding = async (chunk) => {
  const { chunkId, meetingId, text, metadata } = chunk;
  
  if (!text) {
    throw new Error('Chunk text is missing');
  }
  
  // Use chunkId + text length as a unique cache key
  const cacheKey = `${chunkId}_${text.length}`;
  
  if (cache.has(cacheKey)) {
    console.log(`Using cached embedding for chunk ${chunkId}`);
    return cache.get(cacheKey);
  }

  console.log('Generating embedding...');
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUT);

    const response = await fetch(`${config.OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.EMBEDDING_MODEL,
        prompt: text
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Ollama API returned status ${response.status}`);
    }
    
    const data = await response.json();
    const vector = data.embedding;
    
    // Validate the generated vector
    validateEmbedding(vector, config.EMBEDDING_DIMENSION);
    
    const generationTime = Date.now() - startTime;
    console.log(`Embedding generated`);
    console.log(`Dimension: ${vector.length}`);
    console.log(`Generation time: ${generationTime}ms`);
    
    const result = {
      chunkId,
      meetingId,
      vector,
      dimension: vector.length,
      metadata: metadata || {}
    };
    
    // Store in cache
    cache.set(cacheKey, result);
    
    // Keep cache size bounded
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  } catch (error) {
    console.error('Error in embedding generation:', error.message);
    throw error;
  }
};

module.exports = {
  generateEmbedding
};
