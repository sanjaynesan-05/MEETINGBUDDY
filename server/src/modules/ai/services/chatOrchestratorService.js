const { validateChatRequest } = require('./requestValidationService');
const { generateContextMetadata } = require('./conversationContextService');
const { composeResponse } = require('./responseComposerService');

// Sub-pipeline imports
const { generateQueryEmbedding } = require('./queryEmbeddingService');
const { searchQdrant, searchMongoDB } = require('./retrievalService');
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
  let queryVector;
  try {
    queryVector = await generateQueryEmbedding(question);
  } catch (embedError) {
    console.error('[ChatOrchestrator] Embedding generation failed:', embedError.message);
    queryVector = null;
  }

  let rawResults = [];
  let retrievalSource = 'none';

  // Attempt Qdrant vector search
  if (queryVector) {
    try {
      rawResults = await searchQdrant(queryVector, filters);
      if (rawResults && rawResults.length > 0) {
        retrievalSource = 'qdrant';
      }
    } catch (qdrantError) {
      console.warn('[ChatOrchestrator] Qdrant search failed:', qdrantError.message);
    }
  }

  // Fallback to MongoDB if Qdrant returned no results
  if (rawResults.length === 0) {
    console.log('[ChatOrchestrator] Qdrant returned no results — falling back to MongoDB...');
    try {
      rawResults = await searchMongoDB(question, filters);
      if (rawResults && rawResults.length > 0) {
        retrievalSource = 'mongodb_fallback';
      }
    } catch (mongoError) {
      console.error('[ChatOrchestrator] MongoDB fallback also failed:', mongoError.message);
    }
  }

  if (rawResults.length === 0) {
    console.warn('[ChatOrchestrator] No context retrieved — generating response with no context');
    retrievalSource = 'none';
  }

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
    question: question,
    retrievalSource,
  };

  let generationResult;
  try {
    generationResult = await generateResponse(generationPackage);
  } catch (genError) {
    console.error('[ChatOrchestrator] Generation failed:', genError.message);
    generationResult = {
      answer: "I'm unable to generate a response at this time due to an AI service error.",
      citations: [],
      confidence: 0,
      metadata: { responseTime: Date.now() - startTime, chunkCount: contextChunks.length, model: 'unavailable' },
    };
  }

  // 5. Compose Response
  const finalResponse = composeResponse(question, generationResult, requestMetadata, startTime, retrievalSource);

  console.log('Returning response');
  console.log(`Total duration: ${finalResponse.metadata.responseTime}ms`);

  return finalResponse;
};

module.exports = { executeChatPipeline };
