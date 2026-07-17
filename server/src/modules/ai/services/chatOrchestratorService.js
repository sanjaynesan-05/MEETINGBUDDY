const { validateChatRequest } = require('./requestValidationService');
const { generateContextMetadata } = require('./conversationContextService');
const { composeResponse } = require('./responseComposerService');

// Sub-pipeline imports
const { generateQueryEmbedding } = require('./queryEmbeddingService');
const { searchQdrant } = require('./retrievalService');
const { rankResults } = require('./rankingService');
const { buildContext } = require('./contextBuilderService');
const { buildPromptPackage } = require('./promptBuilderService');
const { generateResponse } = require('./generationService');

const config = require('../config/chatConfig');

const executeChatPipeline = async (question, filters = {}, sessionId = null) => {
  const startTime = Date.now();
  
  console.log('Incoming question:', question);
  
  // 1. Validate
  validateChatRequest(question, filters);
  console.log('Validation passed');
  
  const requestMetadata = generateContextMetadata(sessionId);
  
  // 2. Retrieval Engine
  console.log('Retrieving context...');
  const queryVector = await generateQueryEmbedding(question);
  const rawResults = await searchQdrant(queryVector, filters);
  const rankedResults = rankResults(rawResults);
  const contextChunks = buildContext(rankedResults);
  
  // 3. Prompt Builder Engine
  console.log('Building prompt...');
  const promptPackage = buildPromptPackage(question, contextChunks, config.DEFAULT_TEMPLATE);
  
  // 4. Generation Engine
  console.log('Generating response...');
  const generationPackage = {
    prompt: promptPackage.prompt,
    contextChunks: contextChunks,
    question: question
  };
  
  const generationResult = await generateResponse(generationPackage);
  
  // 5. Compose Response
  const finalResponse = composeResponse(question, generationResult, requestMetadata, startTime);
  
  console.log('Returning response');
  console.log(`Total duration: ${finalResponse.metadata.responseTime}ms`);
  
  return finalResponse;
};

module.exports = { executeChatPipeline };
