const { default: ollama } = require('ollama');
const { DEFAULT_MODEL } = require('./embedding.constants');

/**
 * Base Abstract Embedding Provider
 */
class BaseEmbeddingProvider {
  constructor(name, model) {
    this.name = name;
    this.model = model;
  }

  /**
   * Abstract method to generate embeddings for an array of text strings.
   * @param {string[]} texts
   * @returns {Promise<Array<{ vector: number[], dimensions: number }>>}
   */
  async generateEmbeddings(texts) {
    throw new Error('generateEmbeddings() must be implemented by concrete provider');
  }
}

/**
 * Ollama Embedding Provider
 */
class OllamaEmbeddingProvider extends BaseEmbeddingProvider {
  constructor(model = process.env.EMBEDDING_MODEL || DEFAULT_MODEL) {
    super('ollama', model);
    this.baseUrl = process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async generateEmbeddings(texts) {
    if (!texts || texts.length === 0) return [];

    const results = [];
    for (const text of texts) {
      try {
        // Primary attempt using SDK
        let response;
        if (typeof ollama.embed === 'function') {
          response = await ollama.embed({
            model: this.model,
            input: text,
          });
        } else {
          // Fallback to HTTP endpoint /api/embed or /api/embeddings
          const httpRes = await fetch(`${this.baseUrl}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.model, prompt: text }),
          });

          if (!httpRes.ok) {
            throw new Error(`Ollama embedding API error: ${httpRes.statusText}`);
          }
          const data = await httpRes.json();
          response = { embeddings: [data.embedding] };
        }

        const vector = response.embeddings
          ? response.embeddings[0]
          : response.embedding;

        if (!vector || !Array.isArray(vector)) {
          throw new Error(`Invalid vector format returned from Ollama for model ${this.model}`);
        }

        results.push({
          vector,
          dimensions: vector.length,
        });
      } catch (err) {
        console.error(`[OllamaEmbeddingProvider] Error embedding text:`, err.message);
        throw err;
      }
    }

    return results;
  }
}

/**
 * OpenAI Embedding Provider (Pluggable Stub / Implementation)
 */
class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  constructor(model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small') {
    super('openai', model);
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  async generateEmbeddings(texts) {
    if (!texts || texts.length === 0) return [];
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAIEmbeddingProvider');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error (${response.status}): ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((item) => ({
      vector: item.embedding,
      dimensions: item.embedding.length,
    }));
  }
}

/**
 * Mock Embedding Provider (For testing & offline validation)
 */
class MockEmbeddingProvider extends BaseEmbeddingProvider {
  constructor(dimensions = 768) {
    super('mock', 'mock-embedding-v1');
    this.dimensions = dimensions;
  }

  async generateEmbeddings(texts) {
    if (!texts || texts.length === 0) return [];

    return texts.map((t) => {
      // Create a deterministic pseudo vector based on character codes
      const vector = new Array(this.dimensions).fill(0).map((_, i) => {
        const charCode = t.charCodeAt(i % t.length) || 1;
        return parseFloat((Math.sin(charCode + i) * 0.5).toFixed(6));
      });

      return {
        vector,
        dimensions: this.dimensions,
      };
    });
  }
}

module.exports = {
  BaseEmbeddingProvider,
  OllamaEmbeddingProvider,
  OpenAIEmbeddingProvider,
  MockEmbeddingProvider,
};
