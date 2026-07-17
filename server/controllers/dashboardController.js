const Meeting = require('../models/Meeting');

// @desc    Get aggregated dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const pipeline = [
      { $match: { uploadedBy: userId } },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalMeetings: { $sum: 1 },
                completedMeetings: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                processingMeetings: { $sum: { $cond: [{ $in: ["$status", ["uploading", "transcribing"]] }, 1, 0] } },
                totalDuration: { $sum: "$duration" }, // in seconds
                aiSummariesGenerated: { $sum: { $cond: [{ $ne: ["$aiAnalysis.summary", ""] }, 1, 0] } },
              }
            }
          ],
          activity: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
          ],
          meetingTypes: [
            {
              $group: {
                _id: "$fileType", // 'audio' or 'video'
                value: { $sum: 1 }
              }
            }
          ],
          recentMeetings: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { title: 1, status: 1, createdAt: 1, duration: 1, transcriptionStatus: 1, aiAnalysis: 1 } }
          ],
          keywordsList: [
            { $unwind: "$aiAnalysis.keywords" },
            { $group: { _id: "$aiAnalysis.keywords", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 }
          ],
          peopleList: [
            { $unwind: "$aiAnalysis.people" },
            { $group: { _id: "$aiAnalysis.people", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          pendingActionsList: [
            { $unwind: "$aiAnalysis.actionItems" },
            { $match: { "aiAnalysis.actionItems.status": "Pending" } },
            { $sort: { "createdAt": -1 } }, 
            { $limit: 10 },
            {
               $project: {
                  meetingId: "$_id",
                  meetingTitle: "$title",
                  task: "$aiAnalysis.actionItems.task",
                  owner: "$aiAnalysis.actionItems.owner",
                  deadline: "$aiAnalysis.actionItems.deadline",
                  priority: "$aiAnalysis.actionItems.priority",
                  status: "$aiAnalysis.actionItems.status"
               }
            }
          ],
          latestProcessed: [
            { $match: { "aiAnalysis.summary": { $ne: "" }, status: "completed" } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { "aiAnalysis.summary": 1, "aiAnalysis.decisions": 1, "aiAnalysis.risks": 1, "aiAnalysis.questions": 1 } }
          ]
        }
      }
    ];

    const [result] = await Meeting.aggregate(pipeline);

    // Format the result
    const statsData = result.stats[0] || {
      totalMeetings: 0,
      completedMeetings: 0,
      processingMeetings: 0,
      totalDuration: 0,
      aiSummariesGenerated: 0
    };

    const totalHours = ((statsData.totalDuration || 0) / 3600).toFixed(1);
    const avgDuration = statsData.totalMeetings > 0 
      ? Math.round((statsData.totalDuration || 0) / statsData.totalMeetings / 60) // in minutes
      : 0;

    // Map recent meetings to include an aiStatus helper flag
    const mappedRecentMeetings = result.recentMeetings.map(m => ({
      _id: m._id,
      title: m.title,
      status: m.status,
      createdAt: m.createdAt,
      duration: m.duration,
      transcriptionStatus: m.transcriptionStatus,
      aiStatus: m.aiAnalysis?.summary ? "completed" : "pending"
    }));

    const response = {
      stats: {
        totalMeetings: statsData.totalMeetings,
        completedMeetings: statsData.completedMeetings,
        processingMeetings: statsData.processingMeetings,
        totalRecordingHours: parseFloat(totalHours),
        aiSummariesGenerated: statsData.aiSummariesGenerated,
        pendingActionItems: result.pendingActionsList.length,
        averageMeetingDuration: avgDuration // in mins
      },
      activity: result.activity.map(a => ({ date: a._id, count: a.count })),
      meetingTypes: result.meetingTypes.map(m => ({ name: m._id || 'Unknown', value: m.value })),
      recentMeetings: mappedRecentMeetings,
      topKeywords: result.keywordsList.map(k => k._id),
      topPeople: result.peopleList.map(p => p._id),
      pendingActions: result.pendingActionsList,
      latestSummary: result.latestProcessed[0]?.aiAnalysis?.summary || null,
      latestDecisions: result.latestProcessed[0]?.aiAnalysis?.decisions || [],
      latestRisks: result.latestProcessed[0]?.aiAnalysis?.risks || [],
      questions: result.latestProcessed[0]?.aiAnalysis?.questions || { answered: [], unanswered: [] }
    };

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

module.exports = { getDashboardStats };
