const config = require('../config/promptConfig');

const formatUserPrompt = (question) => {
  console.log('Formatting user prompt...');
  let formatted = `QUESTION\n\n${question}\n\n--------------------------------\n\n`;
  formatted += `RESPONSE FORMAT\n\nRequired Output:\nGrounded Answer\n`;
  
  if (config.ENABLE_CITATIONS) {
    formatted += `Optional Citations\n`;
  }
  if (config.ENABLE_CONFIDENCE) {
    formatted += `Confidence\n`;
  }
  
  formatted += `\n--------------------------------\n`;
  return formatted;
};

module.exports = { formatUserPrompt };
