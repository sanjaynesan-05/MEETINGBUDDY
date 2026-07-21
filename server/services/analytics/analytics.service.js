const Meeting = require('../../models/Meeting');
const { buildMatchStage, roundNumber } = require('./analytics.helpers');
const { DEFAULT_LIMITS } = require('./analytics.constants');

class AnalyticsService {
  /**
   * Main Dashboard Aggregation: combines all metrics into one efficient call
   */
  async getDashboard(userId, query = {}) {
    const [
      overview,
      sentiment,
      actionItems,
      participants,
      trends,
      keywords,
      meetingTypes,
      emotion,
      engagement
    ] = await Promise.all([
      this.getOverview(userId, query),
      this.getSentimentDistribution(userId, query),
      this.getActionItemsStats(userId, query),
      this.getTopParticipants(userId, query),
      this.getMeetingTrends(userId, query),
      this.getTopKeywords(userId, query),
      this.getMeetingTypes(userId, query),
      this.getEmotionDistribution(userId, query),
      this.getEngagementStats(userId, query)
    ]);

    return {
      overview,
      sentiment,
      actionItems,
      participants,
      trends,
      keywords,
      meetingTypes,
      emotion,
      engagement
    };
  }

  /**
   * Health endpoint: Returns count of meetings by status
   */
  async getHealth(userId) {
    const pipeline = [
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];
    
    const results = await Meeting.aggregate(pipeline);
    
    const health = {
      total: 0,
      completed: 0,
      processing: 0,
      pending: 0,
      failed: 0
    };

    results.forEach(statusStat => {
      health.total += statusStat.count;
      if (statusStat._id === 'completed') health.completed = statusStat.count;
      else if (statusStat._id === 'failed') health.failed = statusStat.count;
      else if (['uploading', 'uploaded'].includes(statusStat._id)) health.pending += statusStat.count;
      else if (statusStat._id === 'transcribing') health.processing = statusStat.count;
    });

    return health;
  }

  async getOverview(userId, query = {}) {
    const matchStage = buildMatchStage(userId, query);
    matchStage.status = 'completed'; // Only aggregate completed meetings

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalMeetings: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          averageConfidence: { $avg: '$aiAnalysis.aiInsights.confidence' }
        }
      }
    ];

    const result = await Meeting.aggregate(pipeline);
    
    if (!result || result.length === 0) {
      return { totalMeetings: 0, totalDuration: 0, averageConfidence: 0 };
    }

    return {
      totalMeetings: result[0].totalMeetings,
      totalDuration: result[0].totalDuration || 0,
      averageConfidence: roundNumber(result[0].averageConfidence || 0)
    };
  }

  async getSentimentDistribution(userId, query = {}) {
    const matchStage = buildMatchStage(userId, query);
    matchStage.status = 'completed';

    const pipeline = [
      { $match: matchStage },
      { $match: { 'aiAnalysis.aiInsights.sentiment.overall': { $ne: null } } },
      {
        $group: {
          _id: '$aiAnalysis.aiInsights.sentiment.overall',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await Meeting.aggregate(pipeline);
    
    const sentimentObj = {};
    results.forEach(res => {
      if (res._id) {
        sentimentObj[res._id] = res.count;
      }
    });
    
    return sentimentObj;
  }

  async getEmotionDistribution(userId, query = {}) {
    const matchStage = buildMatchStage(userId, query);
    matchStage.status = 'completed';

    const pipeline = [
      { $match: matchStage },
      { $match: { 'aiAnalysis.aiInsights.emotion.primary': { $ne: null } } },
      {
        $group: {
          _id: '$aiAnalysis.aiInsights.emotion.primary',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await Meeting.aggregate(pipeline);
    
    const emotionObj = {};
    results.forEach(res => {
      if (res._id && res._id !== 'None') {
        emotionObj[res._id] = res.count;
      }
    });
    
    return emotionObj;
  }

  async getEngagementStats(userId, query = {}) {
    const matchStage = buildMatchStage(userId, query);
    matchStage.status = 'completed';

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$aiAnalysis.aiInsights.engagement.score' },
          levels: { $push: '$aiAnalysis.aiInsights.engagement.level' }
        }
      }
    ];

    const results = await Meeting.aggregate(pipeline);
    
    if (!results || results.length === 0) {
      return { averageScore: 0, High: 0, Medium: 0, Low: 0 };
    }

    const levels = results[0].levels || [];
    const levelCounts = levels.reduce((acc, level) => {
      if (level) acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, { High: 0, Medium: 0, Low: 0 });

    return {
      averageScore: roundNumber(results[0].averageScore || 0),
      ...levelCounts
    };
  }

  async getMeetingTypes(userId, query = {}) {
    const matchStage = buildMatchStage(userId, query);
    matchStage.status = 'completed';

    const pipeline = [
      { $match: matchStage },
      { $match: { 'aiAnalysis.meetingType': { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$aiAnalysis.meetingType',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await Meeting.aggregate(pipeline);
    
    const typesObj = {};
    results.forEach(res => {
      if (res._id) typesObj[res._id] = res.count;
    });
    
    return typesObj;
  }

  async getActionItemsStats(userId, query = {}) {
    const matchStage = buildMatchStage(userId, query);
    matchStage.status = 'completed';

    const pipeline = [
      { $match: matchStage },
      { $unwind: { path: '$aiAnalysis.actionItems', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { 
            $sum: { $cond: [{ $eq: ['$aiAnalysis.actionItems.status', 'Completed'] }, 1, 0] } 
          },
          pending: { 
            $sum: { $cond: [{ $eq: ['$aiAnalysis.actionItems.status', 'Pending'] }, 1, 0] } 
          },
          highPriority: { 
            $sum: { $cond: [{ $eq: ['$aiAnalysis.actionItems.priority', 'High'] }, 1, 0] } 
          }
        }
      }
    ];

    const result = await Meeting.aggregate(pipeline);
    
    if (!result || result.length === 0) {
      return { total: 0, completed: 0, pending: 0, highPriority: 0 };
    }

    return {
      total: result[0].total,
      completed: result[0].completed,
      pending: result[0].pending,
      highPriority: result[0].highPriority
    };
  }

  async getTopParticipants(userId, query = {}) {
    const matchStage = buildMatchStage(userId, query);
    matchStage.status = 'completed';

    const pipeline = [
      { $match: matchStage },
      { $unwind: { path: '$aiAnalysis.people', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$aiAnalysis.people',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: DEFAULT_LIMITS.TOP_PARTICIPANTS }
    ];

    const results = await Meeting.aggregate(pipeline);
    
    return results.map(r => ({
      name: r._id,
      count: r.count
    }));
  }

  async getTopKeywords(userId, query = {}) {
    const matchStage = buildMatchStage(userId, query);
    matchStage.status = 'completed';

    const pipeline = [
      { $match: matchStage },
      { $unwind: { path: '$aiAnalysis.keywords', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: { $toLower: '$aiAnalysis.keywords' },
          original: { $first: '$aiAnalysis.keywords' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: DEFAULT_LIMITS.TOP_KEYWORDS }
    ];

    const results = await Meeting.aggregate(pipeline);
    
    return results.map(r => ({
      keyword: r.original,
      count: r.count
    }));
  }

  async getMeetingTrends(userId, query = {}) {
    const matchStage = buildMatchStage(userId, query);
    matchStage.status = 'completed';

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          // Group by Year-Month
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } } // Sort chronologically
    ];

    const results = await Meeting.aggregate(pipeline);
    
    return results.map(r => ({
      date: r._id,
      count: r.count
    }));
  }
}

// Export a singleton instance
module.exports = new AnalyticsService();
