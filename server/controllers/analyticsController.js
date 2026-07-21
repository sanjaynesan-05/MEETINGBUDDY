const analyticsService = require('../services/analytics/analytics.service');

// Utility to validate date filters
function validateDateFilters(req, res) {
  const { from, to } = req.query;
  
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format provided for from/to.' });
      return false;
    }
    
    if (fromDate > toDate) {
      res.status(400).json({ success: false, message: 'The "from" date cannot be after the "to" date.' });
      return false;
    }
  }
  return true;
}

exports.getDashboard = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const dashboard = await analyticsService.getDashboard(req.user.id, req.query);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    next(error);
  }
};

exports.getHealth = async (req, res, next) => {
  try {
    const health = await analyticsService.getHealth(req.user.id);
    res.status(200).json({ success: true, data: health });
  } catch (error) {
    console.error('Error fetching health analytics:', error);
    next(error);
  }
};

exports.getOverview = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const overview = await analyticsService.getOverview(req.user.id, req.query);
    res.status(200).json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
};

exports.getSentiment = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const sentiment = await analyticsService.getSentimentDistribution(req.user.id, req.query);
    res.status(200).json({ success: true, data: sentiment });
  } catch (error) {
    next(error);
  }
};

exports.getEmotion = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const emotion = await analyticsService.getEmotionDistribution(req.user.id, req.query);
    res.status(200).json({ success: true, data: emotion });
  } catch (error) {
    next(error);
  }
};

exports.getEngagement = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const engagement = await analyticsService.getEngagementStats(req.user.id, req.query);
    res.status(200).json({ success: true, data: engagement });
  } catch (error) {
    next(error);
  }
};

exports.getMeetingTypes = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const meetingTypes = await analyticsService.getMeetingTypes(req.user.id, req.query);
    res.status(200).json({ success: true, data: meetingTypes });
  } catch (error) {
    next(error);
  }
};

exports.getActionItems = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const actionItems = await analyticsService.getActionItemsStats(req.user.id, req.query);
    res.status(200).json({ success: true, data: actionItems });
  } catch (error) {
    next(error);
  }
};

exports.getParticipants = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const participants = await analyticsService.getTopParticipants(req.user.id, req.query);
    res.status(200).json({ success: true, data: participants });
  } catch (error) {
    next(error);
  }
};

exports.getTrends = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const trends = await analyticsService.getMeetingTrends(req.user.id, req.query);
    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
};

exports.getKeywords = async (req, res, next) => {
  try {
    if (!validateDateFilters(req, res)) return;
    const keywords = await analyticsService.getTopKeywords(req.user.id, req.query);
    res.status(200).json({ success: true, data: keywords });
  } catch (error) {
    next(error);
  }
};
