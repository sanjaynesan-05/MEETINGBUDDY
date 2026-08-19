const composeResponse = (question, generationResult, requestMetadata, startTime, retrievalSource = 'none') => {
  console.log('Formatting output...');

  const responseTime = Date.now() - startTime;

  const response = {
    success: true,
    question: question,
    answer: generationResult.answer,
    confidence: generationResult.confidence || 0.0,
    citations: generationResult.citations || [],
    retrieval: {
      source: retrievalSource,
      vectorSearchAvailable: retrievalSource !== 'none',
    },
    metadata: {
      requestId: requestMetadata.requestId,
      responseTime: responseTime,
      chunksUsed: generationResult.metadata ? generationResult.metadata.chunkCount : 0,
      model: generationResult.metadata ? generationResult.metadata.model : 'unknown',
      generatedAt: requestMetadata.timestamp
    }
  };

  return response;
};

module.exports = { composeResponse };
