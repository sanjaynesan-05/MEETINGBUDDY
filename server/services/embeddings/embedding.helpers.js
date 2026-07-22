const crypto = require('crypto');
const { TOKEN_ESTIMATION_RATIO, CURRENT_CHUNK_VERSION } = require('./embedding.constants');

/**
 * Generate a deterministic chunk ID.
 * @param {string} meetingId
 * @param {number} index
 * @param {number} version
 * @returns {string}
 */
const generateChunkId = (meetingId, index, version = CURRENT_CHUNK_VERSION) => {
  return `chk_${meetingId}_v${version}_idx${index}`;
};

/**
 * Compute SHA-256 hash of given text.
 * @param {string} text
 * @returns {string}
 */
const computeContentHash = (text) => {
  if (!text) return '';
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
};

/**
 * Estimate token count lightweight without an LLM call.
 * tokens ≈ characters / 4
 * @param {string} text
 * @returns {number}
 */
const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length * TOKEN_ESTIMATION_RATIO);
};

/**
 * Normalize whitespace in text.
 * @param {string} text
 * @returns {string}
 */
const normalizeText = (text) => {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
};

/**
 * Split text by sentence boundaries (. ! ?) and paragraphs.
 * @param {string} text
 * @returns {string[]}
 */
const splitTextByBoundaries = (text) => {
  if (!text) return [];
  // Split on double linebreaks or sentence ending punctuation followed by space/newline
  const rawSegments = text.split(/(?:\r?\n\r?\n|(?<=[.!?])\s+)/);
  return rawSegments
    .map((s) => normalizeText(s))
    .filter((s) => s.length > 0);
};

module.exports = {
  generateChunkId,
  computeContentHash,
  estimateTokens,
  normalizeText,
  splitTextByBoundaries,
};
