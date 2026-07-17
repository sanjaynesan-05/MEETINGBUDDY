const { callOllama } = require('./ollamaClient');
const { parseResponse } = require('./responseParserService');
const { buildCitations } = require('./citationService');
const { calculateConfidence } = require('./confidenceService');
const { formatOutput } = require('./outputFormatterService');

const generateResponse = async (promptPackage) => {
  const { prompt, contextChunks } = promptPackage;
  
  const startTime = Date.now();
  
  const rawOllamaResponse = await callOllama(prompt);
  
  const parsed = parseResponse(rawOllamaResponse);
  
  const citations = buildCitations(contextChunks);
  
  const confidence = calculateConfidence(contextChunks);
  
  const responseTime = Date.now() - startTime;
  const tokenEstimate = rawOllamaResponse.eval_count || Math.ceil(parsed.answer.length / 4);
  const chunkCount = contextChunks ? contextChunks.length : 0;
  
  const output = formatOutput(
    parsed.answer,
    citations,
    confidence,
    { responseTime, tokenEstimate, chunkCount }
  );
  
  return output;
};

module.exports = { generateResponse };
