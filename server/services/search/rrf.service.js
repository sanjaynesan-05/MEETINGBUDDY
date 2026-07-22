const searchService = require('./search.service');
const vectorSearchService = require('./vectorSearch.service');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('./search.constants');

const RRF_K = 60;

class RRFService {
  async hybridSearch(userId, params) {
    const startTime = Date.now();
    const { q: query, page = 1, limit = DEFAULT_PAGE_SIZE, from, to, meetingType } = params;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));

    if (!query || !query.trim()) {
      return searchService.search(userId, params);
    }

    const [keywordResults, vectorResults] = await Promise.allSettled([
      searchService.search(userId, params),
      vectorSearchService.search(query, { meetingId: params.meetingId }),
    ]);

    const kwData = keywordResults.status === 'fulfilled' ? keywordResults.value.results || [] : [];
    const vecData = vectorResults.status === 'fulfilled' ? vectorResults.value.results || [] : [];

    const fused = this._reciprocalRankFusion(kwData, vecData);

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

  _reciprocalRankFusion(keywordResults, vectorResults) {
    const scoreMap = new Map();

    const addScores = (results, listIndex) => {
      for (let rank = 0; rank < results.length; rank++) {
        const item = results[rank];
        const id = listIndex === 0
          ? (item.meetingId || item.meetingId)
          : (item.meetingId || item.chunkId);
        const rrfScore = 1 / (RRF_K + rank + 1);

        if (scoreMap.has(id)) {
          const entry = scoreMap.get(id);
          entry.rrfScore += rrfScore;
          entry.sources.push(listIndex);
          if (listIndex === 0) entry.keywordRank = rank + 1;
          if (listIndex === 1) entry.vectorRank = rank + 1;
        } else {
          const displayItem = listIndex === 0
            ? item
            : {
                meetingId: item.meetingId,
                meetingTitle: item.meetingTitle || '',
                snippet: item.text || '',
                score: item.score || 0,
                matchType: 'Vector',
                snippetField: 'Transcript',
                chunkId: item.chunkId,
              };
          scoreMap.set(id, {
            id,
            item: displayItem,
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
      rrfScore: entry.rrfScore,
      keywordRank: entry.keywordRank,
      vectorRank: entry.vectorRank,
      sources: entry.sources,
    }));
  }
}

module.exports = new RRFService();
