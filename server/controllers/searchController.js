const searchService = require('../services/search/search.service');
const rrfService = require('../services/search/rrf.service');

exports.searchMeetings = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const userId = req.user.id;

    const result = await searchService.search(userId, req.query);

    console.log(`[Search] User: ${userId} | Query: "${req.query.q || ''}" | Results: ${result.stats.returned} | Time: ${result.stats.executionTimeMs}ms`);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in Search Controller:', error);
    next(error);
  }
};

exports.hybridSearch = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await rrfService.hybridSearch(userId, req.query);

    console.log(`[HybridSearch] User: ${userId} | Query: "${req.query.q || ''}" | Results: ${result.stats.returned} | Time: ${result.stats.executionTimeMs}ms`);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in Hybrid Search Controller:', error);
    next(error);
  }
};
