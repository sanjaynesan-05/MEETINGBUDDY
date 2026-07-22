const { DEFAULT_PROVIDER } = require('./embedding.constants');
const {
  OllamaEmbeddingProvider,
  OpenAIEmbeddingProvider,
  MockEmbeddingProvider,
} = require('./embedding.provider');

/**
 * Embedding Provider Factory
 * Decouples service logic from specific embedding model providers.
 */
class EmbeddingProviderFactory {
  constructor() {
    this.providers = new Map();
  }

  /**
   * Get an embedding provider instance by name.
   *
   * @param {string} [providerName] - Optional provider name override ('ollama', 'openai', 'mock')
   * @param {Object} [options] - Additional provider options/models
   * @returns {BaseEmbeddingProvider}
   */
  getProvider(providerName = process.env.EMBEDDING_PROVIDER || DEFAULT_PROVIDER, options = {}) {
    const key = (providerName || '').toLowerCase().trim();

    if (this.providers.has(key) && !options.forceNew) {
      return this.providers.get(key);
    }

    let instance;
    switch (key) {
      case 'ollama':
        instance = new OllamaEmbeddingProvider(options.model);
        break;
      case 'openai':
        instance = new OpenAIEmbeddingProvider(options.model);
        break;
      case 'mock':
      case 'test':
        instance = new MockEmbeddingProvider(options.dimensions || 768);
        break;
      default:
        console.warn(`[EmbeddingProviderFactory] Unknown provider '${key}'. Falling back to Ollama.`);
        instance = new OllamaEmbeddingProvider(options.model);
        break;
    }

    if (!options.forceNew) {
      this.providers.set(key, instance);
    }

    return instance;
  }
}

module.exports = new EmbeddingProviderFactory();
