const Meeting = require('../models/Meeting');
const icsGenerator = require('../services/calendar/icsGenerator');

exports.exportActionItemsIcs = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    const actionItems = meeting.aiAnalysis && meeting.aiAnalysis.actionItems
      ? meeting.aiAnalysis.actionItems
      : [];

    if (actionItems.length === 0) {
      return res.status(404).json({ success: false, message: 'No action items found for this meeting.' });
    }

    const icsContent = icsGenerator.generateActionItemsIcs(meeting, actionItems);
    if (!icsContent) {
      return res.status(500).json({ success: false, message: 'Failed to generate calendar file.' });
    }

    const safeTitle = meeting.title.replace(/[^a-zA-Z0-9 _-]/g, '_');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="action-items-${safeTitle}.ics"`);
    res.send(icsContent);
  } catch (error) {
    console.error('[CalendarController] Error:', error.message);
    next(error);
  }
};
