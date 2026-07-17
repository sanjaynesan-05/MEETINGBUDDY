require('dotenv').config();

module.exports = {
  SYSTEM_NAME: process.env.SYSTEM_NAME || 'AI Meeting Assistant',
  DEFAULT_TEMPLATE: process.env.DEFAULT_TEMPLATE || 'chat',
  MAX_PROMPT_CHARACTERS: parseInt(process.env.MAX_PROMPT_CHARACTERS, 10) || 32000,
  MAX_CONTEXT_CHARACTERS: parseInt(process.env.MAX_CONTEXT_CHARACTERS, 10) || 24000,
  MAX_SYSTEM_PROMPT: parseInt(process.env.MAX_SYSTEM_PROMPT, 10) || 4000,
  MAX_USER_PROMPT: parseInt(process.env.MAX_USER_PROMPT, 10) || 4000,
  STRICT_GROUNDING: process.env.STRICT_GROUNDING === 'true',
  ENABLE_CITATIONS: process.env.ENABLE_CITATIONS === 'true',
  ENABLE_CONFIDENCE: process.env.ENABLE_CONFIDENCE === 'true'
};
