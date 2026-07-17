const config = require('../config/promptConfig');

const validatePromptData = (question, contextChunks, template) => {
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new Error('Question must be a valid non-empty string');
  }
  
  if (question.length > config.MAX_USER_PROMPT) {
    throw new Error(`Question exceeds max user prompt size of ${config.MAX_USER_PROMPT}`);
  }
  
  if (!contextChunks || !Array.isArray(contextChunks)) {
    throw new Error('Context must be a valid array of chunks');
  }
  
  if (!template) {
    throw new Error('Template is missing');
  }
  
  return true;
};

const validateFinalPrompt = (finalPrompt) => {
  console.log('Validating prompt...');
  if (!finalPrompt || finalPrompt.length === 0) {
    throw new Error('Final prompt generation failed (empty string)');
  }
  
  if (finalPrompt.length > config.MAX_PROMPT_CHARACTERS) {
    throw new Error(`Final prompt exceeds absolute max length of ${config.MAX_PROMPT_CHARACTERS}`);
  }
  
  if (!finalPrompt.includes('SYSTEM') || !finalPrompt.includes('MEETING CONTEXT') || !finalPrompt.includes('QUESTION')) {
    throw new Error('Final prompt is missing required sections');
  }
  
  return true;
};

module.exports = { validatePromptData, validateFinalPrompt };
