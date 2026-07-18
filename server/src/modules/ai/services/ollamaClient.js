const config = require('../config/generationConfig');

const callOllama = async (prompt) => {
  console.log('Loading model...');
  console.log('Generating answer...');

  // Check model availability first
  try {
    const tagsResponse = await fetch(`${config.OLLAMA_URL}/api/tags`);
    if (tagsResponse.ok) {
      const data = await tagsResponse.json();
      const models = data.models || [];
      const modelExists = models.some((m) => m.name === config.OLLAMA_MODEL || m.name === `${config.OLLAMA_MODEL}:latest`);
      
      if (!modelExists) {
        const installedModels = models.map(m => m.name).join(", ");
        throw new Error(`\nConfigured model:\n${config.OLLAMA_MODEL}\n\nInstalled models:\n${installedModels || "None"}\n\nSuggested fix:\nollama pull ${config.OLLAMA_MODEL}`);
      }
    }
  } catch (error) {
    if (error.message.includes('Configured model')) {
      throw error;
    }
    // If it's a fetch error, it might be unreachable
    if (error.cause && error.cause.code === 'ECONNREFUSED' || (error.message && error.message.includes('fetch failed'))) {
      throw new Error("Ollama server is unreachable. Is Ollama running?");
    }
    // Otherwise just log and continue, let the main fetch catch it
    console.warn("Could not verify model availability:", error.message);
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(`${config.OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          num_predict: config.MAX_RESPONSE_TOKENS,
          temperature: config.TEMPERATURE,
          top_p: config.TOP_P,
          top_k: config.TOP_K,
          repeat_penalty: config.REPEAT_PENALTY
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Ollama API returned status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Ollama connection timed out');
    }
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      throw new Error('Ollama connection refused');
    }
    throw error;
  }
};

module.exports = { callOllama };
