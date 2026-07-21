const searchService = require('../services/search/search.service');

exports.searchMeetings = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const userId = req.user.id;
    
    // Pass query params directly to service (it handles defaults and validation)
    const result = await searchService.search(userId, req.query);

    // Add lightweight logging per requirements
    console.log(`[Search] User: ${userId} | Query: "${req.query.q || ''}" | Results: ${result.stats.returned} | Time: ${result.stats.executionTimeMs}ms`);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in Search Controller:', error);
    next(error);
  }
};
