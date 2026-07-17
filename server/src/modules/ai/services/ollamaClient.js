const config = require('../config/generationConfig');

const callOllama = async (prompt) => {
  console.log('Loading model...');
  console.log('Generating answer...');
  
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
