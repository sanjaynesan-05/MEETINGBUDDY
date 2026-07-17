const { getOrCreateSession } = require('./sessionService');
const { loadMessages, appendMessages } = require('./historyService');
const { buildMemoryContext } = require('./memoryBuilderService');
const { checkAndGenerateSummary } = require('./conversationSummaryService');
const { injectContext } = require('./contextInjectionService');
const { executeChatPipeline } = require('./chatOrchestratorService');
const config = require('../config/conversationConfig');

const processConversation = async (sessionId, question, meetingId) => {
  console.log(`[Conversation] Loading session ${sessionId}...`);
  const session = await getOrCreateSession(sessionId, meetingId);
  
  console.log(`[Conversation] Loading history...`);
  const history = loadMessages(session);
  
  let memoryContext = [];
  let summary = null;
  
  if (config.ENABLE_MEMORY) {
    console.log(`[Conversation] Building memory...`);
    memoryContext = buildMemoryContext(session);
    
    console.log(`[Conversation] Generating summary...`);
    summary = await checkAndGenerateSummary(session);
  }
  
  console.log(`[Conversation] Injecting context...`);
  const { enhancedQuestion } = injectContext(memoryContext, question, meetingId);
  
  console.log(`[Conversation] Calling AI Gateway...`);
  const filters = meetingId ? { meetingId } : {};
  const aiResponse = await executeChatPipeline(enhancedQuestion, filters, sessionId);
  
  console.log(`[Conversation] Saving conversation...`);
  const userMsg = { content: question }; // Save original question
  const aiMsg = { 
    content: aiResponse.answer, 
    metadata: {
      citations: aiResponse.citations,
      confidence: aiResponse.confidence
    }
  };
  
  await appendMessages(session, userMsg, aiMsg);
  
  console.log(`[Conversation] Conversation complete.`);
  
  return {
    success: true,
    sessionId: session.sessionId,
    answer: aiResponse.answer,
    conversationSummary: session.summary || null,
    memoryUsed: memoryContext.length > 0,
    metadata: {
      historyMessages: session.messageCount,
      summaryUsed: !!session.summary,
      memoryCharacters: memoryContext.reduce((acc, val) => acc + val.content.length, 0),
      responseTime: aiResponse.metadata?.responseTime || 0
    }
  };
};

module.exports = { processConversation };
