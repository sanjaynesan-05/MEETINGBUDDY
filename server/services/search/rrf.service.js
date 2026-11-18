const mongoose = require('mongoose');
const Meeting = require('../../models/Meeting');
const searchService = require('./search.service');
const vectorSearchService = require('./vectorSearch.service');
const chunkKeywordService = require('./chunkKeyword.service');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('./search.constants');

const RRF_K = 60;
const MIN_CANDIDATES = 20; // per-leg candidate pool before fusion

/**
 * Hybrid retrieval: chunk-level BM25-style keyword search (MongoDB text
 * index) fused with dense vector search (Qdrant) via Reciprocal Rank Fusion.
 *
 * Both legs return transcript chunks, and fusion is keyed by chunkId, so a
 * meeting can contribute several chunks. (Previously results were keyed by
 * meetingId, which collapsed every meeting to a single chunk.)
 */
class RRFService {
  async hybridSearch(userId, params) {
    const startTime = Date.now();
    const { q: query, page = 1, limit = DEFAULT_PAGE_SIZE, from, to, meetingType, meetingId, unscoped = false } = params;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));

    if (!query || !query.trim()) {
      return searchService.search(userId, params);
    }

    const pool = Math.max(MIN_CANDIDATES, pageNum * limitNum);
    const [keywordResults, vectorResults] = await Promise.allSettled([
      chunkKeywordService.search(query, { userId, meetingId, limit: pool, unscoped }),
      vectorSearchService.search(query, { meetingId, userId, limit: pool, unscoped }),
    ]);

    if (keywordResults.status === 'rejected') {
      console.warn('[RRF] Keyword leg failed:', keywordResults.reason && keywordResults.reason.message);
    }
    const kwData = keywordResults.status === 'fulfilled' ? keywordResults.value : [];
    const vecData = vectorResults.status === 'fulfilled' ? vectorResults.value.results || [] : [];

    let fused = this._reciprocalRankFusion(kwData, vecData);
    fused = await this._applyMeetingFilters(fused, { from, to, meetingType });
    await this._attachMeetingTitles(fused);

    const total = fused.length;
    const skip = (pageNum - 1) * limitNum;
    const paged = fused.slice(skip, skip + limitNum);

    return {
      success: true,
      query,
      hybrid: true,
      stats: {
        executionTimeMs: Date.now() - startTime,
        keywordMatches: kwData.length,
        vectorMatches: vecData.length,
        returned: paged.length,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
      },
      results: paged,
    };
  }

  /** Fuse two ranked chunk lists. Items are identified by chunkId. */
  _reciprocalRankFusion(keywordResults, vectorResults) {
    const scoreMap = new Map();

    const addScores = (results, listIndex) => {
      for (let rank = 0; rank < results.length; rank++) {
        const item = results[rank];
        const id = item.chunkId || `${item.meetingId}:${rank}:${listIndex}`;
        const rrfScore = 1 / (RRF_K + rank + 1);

        if (scoreMap.has(id)) {
          const entry = scoreMap.get(id);
          entry.rrfScore += rrfScore;
          entry.sources.push(listIndex);
          if (listIndex === 0) entry.keywordRank = rank + 1;
          if (listIndex === 1) entry.vectorRank = rank + 1;
        } else {
          scoreMap.set(id, {
            item: {
              meetingId: String(item.meetingId),
              meetingTitle: item.meetingTitle || '',
              chunkId: item.chunkId,
              snippet: item.text || item.snippet || '',
              speaker: item.speaker || null,
              score: item.score || 0,
              matchType: listIndex === 0 ? 'Keyword' : 'Vector',
              snippetField: 'Transcript',
            },
            rrfScore,
            keywordRank: listIndex === 0 ? rank + 1 : null,
            vectorRank: listIndex === 1 ? rank + 1 : null,
            sources: [listIndex],
          });
        }
      }
    };

    addScores(keywordResults, 0);
    addScores(vectorResults, 1);

    const fused = Array.from(scoreMap.values());
    fused.sort((a, b) => b.rrfScore - a.rrfScore);
    return fused.map((entry) => ({
      ...entry.item,
      matchType: entry.sources.length > 1 ? 'Hybrid' : entry.item.matchType,
      rrfScore: entry.rrfScore,
      keywordRank: entry.keywordRank,
      vectorRank: entry.vectorRank,
      sources: entry.sources,
    }));
  }

  async _applyMeetingFilters(results, { from, to, meetingType }) {
    if (!results.length || (!from && !to && !meetingType)) return results;
    const ids = [...new Set(results.map((r) => r.meetingId))].filter((id) => mongoose.Types.ObjectId.isValid(id));
    const q = { _id: { $in: ids } };
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        q.createdAt.$lte = toDate;
      }
    }
    if (meetingType) q['aiAnalysis.meetingType'] = meetingType;
    const allowed = new Set((await Meeting.find(q).select('_id').lean()).map((m) => String(m._id)));
    return results.filter((r) => allowed.has(r.meetingId));
  }

  async _attachMeetingTitles(results) {
    const ids = [...new Set(results.filter((r) => !r.meetingTitle).map((r) => r.meetingId))]
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!ids.length) return;
    const titles = new Map((await Meeting.find({ _id: { $in: ids } }).select('title').lean())
      .map((m) => [String(m._id), m.title]));
    for (const r of results) if (!r.meetingTitle) r.meetingTitle = titles.get(r.meetingId) || '';
  }
}

module.exports = new RRFService();
