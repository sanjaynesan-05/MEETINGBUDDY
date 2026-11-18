const MeetingChunk = require('../../models/MeetingChunk');
const { getOwnedMeetingIds } = require('./meetingAccess');

/**
 * Chunk-level lexical retrieval using MongoDB's full-text index.
 *
 * Unlike the meeting-level regex search used by the Search page (which
 * matches the whole query as one phrase), this scores individual transcript
 * chunks by term overlap with stemming, so it can be fused with dense
 * vector results at the same granularity.
 */
let indexReady = null;
const ensureIndex = () => {
  if (!indexReady) {
    indexReady = MeetingChunk.createIndexes().catch((err) => {
      indexReady = null;
      throw err;
    });
  }
  return indexReady;
};

class ChunkKeywordService {
  /**
   * @param {string} query
   * @param {{ userId?: string, meetingId?: string, limit?: number, unscoped?: boolean }} params
   *   `unscoped` searches every meeting and is only for offline benchmarks.
   * @returns {Promise<Array<{meetingId:string, chunkId:string, text:string, speaker:?string, score:number}>>}
   */
  async search(query, { userId, meetingId, limit = 10, unscoped = false } = {}) {
    if (!query || !query.trim()) return [];
    await ensureIndex();

    const filter = { $text: { $search: query } };
    if (unscoped) {
      if (meetingId) filter.meetingId = meetingId;
    } else {
      const owned = await getOwnedMeetingIds(userId);
      if (meetingId && meetingId !== 'all') {
        if (!owned.includes(String(meetingId))) return [];
        filter.meetingId = meetingId;
      } else {
        if (owned.length === 0) return [];
        filter.meetingId = { $in: owned };
      }
    }

    const docs = await MeetingChunk.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('meetingId chunkId text metadata.speaker')
      .lean();

    return docs.map((d) => ({
      meetingId: String(d.meetingId),
      chunkId: d.chunkId,
      text: d.text,
      speaker: (d.metadata && d.metadata.speaker) || null,
      score: d.score,
    }));
  }
}

module.exports = new ChunkKeywordService();
