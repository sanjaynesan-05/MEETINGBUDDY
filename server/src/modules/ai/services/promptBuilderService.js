const config = require('../config/promptConfig');
const { getTemplate } = require('./templateService');
const { generateSystemPrompt } = require('./systemPromptService');
const { formatContext } = require('./contextFormatterService');
const { formatUserPrompt } = require('./userPromptService');
const { validatePromptData, validateFinalPrompt } = require('./promptValidatorService');
const { generatePromptMetadata } = require('./promptMetadataService');

const buildPromptPackage = (question, contextChunks, templateName = config.DEFAULT_TEMPLATE) => {
  try {
    validatePromptData(question, contextChunks, templateName);
    
    const template = getTemplate(templateName);
    
    const systemPromptStr = generateSystemPrompt();
    const contextStr = formatContext(contextChunks);
    const userPromptStr = formatUserPrompt(question);
    
    console.log('Building prompt...');
    const finalPrompt = `--------------------------------\n${systemPromptStr}--------------------------------\n${contextStr}${userPromptStr}`;
    
    validateFinalPrompt(finalPrompt);
    console.log('Prompt ready.');
    
    const metadata = generatePromptMetadata(finalPrompt, contextChunks, template);
    
    return {
      success: true,
      template,
      prompt: finalPrompt,
      metadata
    };
  } catch (error) {
    console.error('Error in prompt builder:', error);
    throw error;
  }
};

module.exports = { buildPromptPackage };
