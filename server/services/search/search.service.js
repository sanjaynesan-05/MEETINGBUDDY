const Meeting = require('../../models/Meeting');
const { buildMatchStage, extractMatchedFields, generateSnippet } = require('./search.helpers');
const { buildScoringStage } = require('./search.scoring');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_SCORE } = require('./search.constants');

class SearchService {
  async search(userId, params) {
    const startTime = Date.now();
    const { 
      q: query, 
      from, 
      to, 
      meetingType, 
      page = 1, 
      limit = DEFAULT_PAGE_SIZE 
    } = params;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));
    const skipNum = (pageNum - 1) * limitNum;

    // 1. Base Match
    const matchStage = buildMatchStage(userId, query, { from, to, meetingType });
    matchStage.status = 'completed'; // Only search completed meetings

    const pipeline = [
      { $match: matchStage }
    ];

    // 2. Add Scoring if query exists
    if (query) {
      const scoringStage = buildScoringStage(query);
      if (scoringStage) pipeline.push(scoringStage);
      
      // 3. Filter by MIN_SCORE
      pipeline.push({
        $match: { finalScore: { $gte: MIN_SCORE } }
      });
      
      // 4. Sort by score
      pipeline.push({
        $sort: { finalScore: -1, createdAt: -1 }
      });
    } else {
      // If no query, just sort by date
      pipeline.push({
        $sort: { createdAt: -1 }
      });
      // Mock score for empty query
      pipeline.push({
        $addFields: { finalScore: 0 }
      });
    }

    // 5. Facet for Pagination and Total
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skipNum }, { $limit: limitNum }]
      }
    });

    // Execute aggregation
    const results = await Meeting.aggregate(pipeline);
    
    const totalCount = results[0]?.metadata[0]?.total || 0;
    const rawData = results[0]?.data || [];

    // Process Snippets and Metadata on the limited result set
    const formattedResults = rawData.map(meeting => {
      let matchInfo = { matchType: 'Metadata', matchedFields: [], snippetField: 'Metadata', rawSnippetText: meeting.title || '' };
      
      if (query) {
        matchInfo = extractMatchedFields(meeting, query);
      }

      return {
        meetingId: meeting._id,
        meetingTitle: meeting.title,
        meetingType: meeting.aiAnalysis?.meetingType || '',
        createdAt: meeting.createdAt,
        score: meeting.finalScore || 0,
        matchType: matchInfo.matchType,
        matchedFields: matchInfo.matchedFields,
        snippetField: matchInfo.snippetField,
        snippet: generateSnippet(matchInfo.rawSnippetText, query)
      };
    });

    const executionTimeMs = Date.now() - startTime;

    // Create the Frontend Contract response
    return {
      success: true,
      query: query || '',
      stats: {
        executionTimeMs,
        searchedMeetings: totalCount, // Roughly equivalent to total matches for this query
        returned: formattedResults.length
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount
      },
      results: formattedResults
    };
  }
}

module.exports = new SearchService();
