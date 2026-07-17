const validateGenerationRequest = (promptPackage) => {
  if (!promptPackage) {
    throw new Error('Prompt package is missing');
  }
  
  const { prompt, contextChunks } = promptPackage;
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt is missing or empty');
  }
  
  if (prompt.length > 100000) {
    throw new Error('Prompt length is excessive');
  }
  
  if (!contextChunks || !Array.isArray(contextChunks)) {
    throw new Error('Context chunks array is missing or invalid');
  }
  
  return true;
};

module.exports = { validateGenerationRequest };
