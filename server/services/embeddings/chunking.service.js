const {
  MAX_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  CURRENT_CHUNK_VERSION,
} = require('./embedding.constants');
const {
  generateChunkId,
  computeContentHash,
  estimateTokens,
  normalizeText,
  splitTextByBoundaries,
} = require('./embedding.helpers');

/**
 * Intelligent Transcript & Context Chunker Service
 */
class ChunkingService {
  /**
   * Chunks a meeting transcript into structured, context-preserving segments.
   *
   * @param {string} meetingId - The ID of the meeting
   * @param {string} transcriptText - Raw transcript or structured text
   * @param {Object} options - Additional options (chunkType, speaker, meetingType, etc.)
   * @returns {Array<Object>} List of chunk objects ready for embedding
   */
  chunkTranscript(meetingId, transcriptText, options = {}) {
    if (!transcriptText || typeof transcriptText !== 'string' || !transcriptText.trim()) {
      return [];
    }

    const {
      chunkType = 'Transcript',
      speaker = null,
      meetingType = '',
      chunkVersion = CURRENT_CHUNK_VERSION,
    } = options;

    const normalized = normalizeText(transcriptText);
    const sentenceSegments = splitTextByBoundaries(normalized);

    const mergedChunks = [];
    let currentBuffer = '';

    for (const segment of sentenceSegments) {
      // If adding segment exceeds MAX_CHUNK_SIZE and buffer isn't empty, flush buffer
      if (currentBuffer && (currentBuffer.length + segment.length + 1 > MAX_CHUNK_SIZE)) {
        mergedChunks.push(currentBuffer);
        currentBuffer = segment;
      } else {
        currentBuffer = currentBuffer ? `${currentBuffer} ${segment}` : segment;
      }

      // If single segment alone is oversized, split it forcibly
      while (currentBuffer.length > MAX_CHUNK_SIZE) {
        const cutPoint = currentBuffer.lastIndexOf(' ', MAX_CHUNK_SIZE) || MAX_CHUNK_SIZE;
        const part = currentBuffer.substring(0, cutPoint).trim();
        mergedChunks.push(part);
        currentBuffer = currentBuffer.substring(cutPoint).trim();
      }
    }

    if (currentBuffer) {
      mergedChunks.push(currentBuffer);
    }

    // Merge tiny trailing chunks if needed
    const finalizedTexts = [];
    let temp = '';

    for (let i = 0; i < mergedChunks.length; i++) {
      const chunkText = mergedChunks[i];
      if (chunkText.length < MIN_CHUNK_SIZE && i < mergedChunks.length - 1) {
        temp = temp ? `${temp} ${chunkText}` : chunkText;
      } else {
        const fullText = temp ? `${temp} ${chunkText}` : chunkText;
        finalizedTexts.push(fullText);
        temp = '';
      }
    }
    if (temp) {
      if (finalizedTexts.length > 0) {
        finalizedTexts[finalizedTexts.length - 1] += ` ${temp}`;
      } else {
        finalizedTexts.push(temp);
      }
    }

    // Map into final chunk data structures
    return finalizedTexts.map((text, index) => {
      const chunkId = generateChunkId(meetingId, index, chunkVersion);
      const contentHash = computeContentHash(text);
      const tokenEstimate = estimateTokens(text);

      return {
        meetingId,
        chunkId,
        chunkVersion,
        contentHash,
        chunkIndex: index,
        text,
        chunkType,
        metadata: {
          speaker,
          startTime: null,
          endTime: null,
          tokenEstimate,
          meetingType,
        },
      };
    });
  }
}

module.exports = new ChunkingService();
