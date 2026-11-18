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

function toValidTime(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeSpeaker(value) {
  if (typeof value !== 'string') return null;

  const speaker = value.trim();

  if (!speaker || speaker.toLowerCase() === 'unknown') {
    return null;
  }

  return speaker;
}

function splitLongText(text) {
  const sentences = splitTextByBoundaries(text);
  const pieces = [];

  for (const sentence of sentences.length ? sentences : [text]) {
    let remaining = sentence;

    while (remaining.length > MAX_CHUNK_SIZE) {
      let cutPoint = remaining.lastIndexOf(' ', MAX_CHUNK_SIZE);

      if (cutPoint <= 0) {
        cutPoint = MAX_CHUNK_SIZE;
      }

      const piece = remaining.slice(0, cutPoint).trim();

      if (piece) pieces.push(piece);

      remaining = remaining.slice(cutPoint).trim();
    }

    if (remaining) pieces.push(remaining);
  }

  return pieces;
}

function groupText(group) {
  return group.map((item) => item.text).join(' ');
}

class ChunkingService {
  chunkTranscript(meetingId, transcriptText, options = {}) {
    if (
      !meetingId ||
      typeof transcriptText !== 'string' ||
      !transcriptText.trim()
    ) {
      return [];
    }

    const {
      chunkType = 'Transcript',
      speaker: defaultSpeaker = null,
      meetingType = '',
      chunkVersion = CURRENT_CHUNK_VERSION,
      transcriptSegments = [],
    } = options;

    const units = [];
    const hasSegments =
      Array.isArray(transcriptSegments) &&
      transcriptSegments.some(
        (segment) =>
          segment &&
          typeof segment.text === 'string' &&
          segment.text.trim()
      );

    if (hasSegments) {
      for (const segment of transcriptSegments) {
        if (!segment || typeof segment.text !== 'string') continue;

        const text = normalizeText(segment.text);
        if (!text) continue;

        const startTime = toValidTime(segment.start);
        const endTime = toValidTime(segment.end);
        const segmentSpeaker = normalizeSpeaker(segment.speaker);

        for (const piece of splitLongText(text)) {
          units.push({
            text: piece,
            startTime,
            endTime,
            speaker: segmentSpeaker,
          });
        }
      }
    } else {
      const text = normalizeText(transcriptText);

      for (const piece of splitLongText(text)) {
        units.push({
          text: piece,
          startTime: null,
          endTime: null,
          speaker: normalizeSpeaker(defaultSpeaker),
        });
      }
    }

    if (!units.length) return [];

    // Group adjacent transcript units without exceeding the size limit.
    let groups = [];
    let currentGroup = [];
    let currentLength = 0;

    for (const unit of units) {
      const addedLength = unit.text.length + (currentGroup.length ? 1 : 0);

      if (
        currentGroup.length &&
        currentLength + addedLength > MAX_CHUNK_SIZE
      ) {
        groups.push(currentGroup);
        currentGroup = [];
        currentLength = 0;
      }

      currentLength += unit.text.length + (currentGroup.length ? 1 : 0);
      currentGroup.push(unit);
    }

    if (currentGroup.length) groups.push(currentGroup);

    // Merge small groups with the following group when they fit.
    let index = 0;

    while (index < groups.length - 1) {
      const leftText = groupText(groups[index]);
      const rightText = groupText(groups[index + 1]);

      if (
        leftText.length < MIN_CHUNK_SIZE &&
        leftText.length + 1 + rightText.length <= MAX_CHUNK_SIZE
      ) {
        groups[index + 1] = [
          ...groups[index],
          ...groups[index + 1],
        ];

        groups.splice(index, 1);
      } else {
        index++;
      }
    }

    // Merge a small final group with the previous one if possible.
    if (groups.length > 1) {
      const lastIndex = groups.length - 1;
      const previousText = groupText(groups[lastIndex - 1]);
      const lastText = groupText(groups[lastIndex]);

      if (
        lastText.length < MIN_CHUNK_SIZE &&
        previousText.length + 1 + lastText.length <= MAX_CHUNK_SIZE
      ) {
        groups[lastIndex - 1] = [
          ...groups[lastIndex - 1],
          ...groups[lastIndex],
        ];

        groups.pop();
      }
    }

    return groups.map((group, index) => {
      const text = groupText(group);
      const speakers = [
        ...new Set(group.map((item) => item.speaker).filter(Boolean)),
      ];

      const firstTimedUnit = group.find(
        (item) => item.startTime !== null
      );

      const reversedGroup = [...group].reverse();
      const lastTimedUnit = reversedGroup.find(
        (item) => item.endTime !== null
      );

      const metadata = {
        speaker:
          speakers.length === 1
            ? speakers[0]
            : speakers.length > 1
              ? 'Multiple speakers'
              : null,
        startTime: firstTimedUnit ? firstTimedUnit.startTime : null,
        endTime: lastTimedUnit ? lastTimedUnit.endTime : null,
        tokenEstimate: estimateTokens(text),
        meetingType,
      };

      return {
        meetingId,
        chunkId: generateChunkId(meetingId, index, chunkVersion),
        chunkVersion,
        contentHash: computeContentHash(text),
        chunkIndex: index,
        text,
        chunkType,
        metadata,
      };
    });
  }
}

module.exports = new ChunkingService();
