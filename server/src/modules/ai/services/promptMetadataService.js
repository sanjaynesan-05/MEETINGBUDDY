const generatePromptMetadata = (finalPrompt, contextChunks, template) => {
  const contextCharacters = contextChunks.reduce((acc, curr) => acc + (curr.text ? curr.text.length : 0), 0);
  const promptCharacters = finalPrompt.length;
  // Estimated tokens (rough approximation: 1 token = ~4 characters)
  const estimatedTokens = Math.ceil(promptCharacters / 4);
  
  return {
    promptSize: promptCharacters,
    contextSize: contextCharacters,
    chunkCount: contextChunks.length,
    estimatedTokens,
    templateUsed: template,
    timestamp: new Date().toISOString()
  };
};

module.exports = { generatePromptMetadata };
