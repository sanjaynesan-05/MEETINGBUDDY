const injectContext = (memory, currentQuestion, meetingId) => {
  if (!memory || memory.length === 0) {
    return {
      enhancedQuestion: currentQuestion,
      historyContext: ''
    };
  }
  
  const historyString = memory.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  }).join('\n\n');
  
  const enhancedQuestion = `Previous Conversation History:\n${historyString}\n\nCurrent Question: ${currentQuestion}`;
  
  return {
    enhancedQuestion,
    historyContext: historyString
  };
};

module.exports = { injectContext };
