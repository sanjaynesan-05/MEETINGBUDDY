const Meeting = require('../models/Meeting');

exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, sort } = req.query;

    const meetings = await Meeting.find({
      uploadedBy: req.user._id,
      status: 'completed',
    }).select('_id title createdAt aiAnalysis.actionItems').lean();

    const tasks = [];
    for (const meeting of meetings) {
      const items = meeting.aiAnalysis?.actionItems || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        tasks.push({
          id: `${meeting._id}_${i}`,
          meetingId: meeting._id,
          meetingTitle: meeting.title,
          meetingDate: meeting.createdAt,
          index: i,
          task: item.task || '',
          owner: item.owner || '',
          deadline: item.deadline || '',
          priority: item.priority || 'Medium',
          status: item.status || 'Pending',
        });
      }
    }

    let filtered = tasks;
    if (status) {
      filtered = filtered.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }
    if (priority) {
      filtered = filtered.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
    }

    if (sort === 'deadline') {
      filtered.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    } else if (sort === 'priority') {
      const pOrder = { High: 0, Medium: 1, Low: 2 };
      filtered.sort((a, b) => (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1));
    } else {
      filtered.sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate));
    }

    const total = filtered.length;
    const pending = filtered.filter(t => t.status !== 'Completed' && t.status !== 'done').length;
    const overdue = filtered.filter(t => {
      if (t.status === 'Completed' || t.status === 'done') return false;
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return !isNaN(d) && d < new Date();
    }).length;

    res.json({
      success: true,
      tasks: filtered,
      stats: { total, pending, overdue },
    });
  } catch (error) {
    console.error('[TaskController] Error:', error.message);
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { meetingId, index } = req.params;
    const { status, owner, priority, deadline, task } = req.body;

    const meeting = await Meeting.findOne({
      _id: meetingId,
      uploadedBy: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    const actionItems = meeting.aiAnalysis?.actionItems || [];
    if (!actionItems[index]) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (status) actionItems[index].status = status;
    if (owner) actionItems[index].owner = owner;
    if (priority) actionItems[index].priority = priority;
    if (deadline) actionItems[index].deadline = deadline;
    if (task) actionItems[index].task = task;

    meeting.markModified('aiAnalysis.actionItems');
    await meeting.save();

    res.json({
      success: true,
      task: {
        id: `${meetingId}_${index}`,
        meetingId,
        meetingTitle: meeting.title,
        index: parseInt(index),
        ...actionItems[index].toObject(),
      },
    });
  } catch (error) {
    console.error('[TaskController] Update error:', error.message);
    next(error);
  }
};
