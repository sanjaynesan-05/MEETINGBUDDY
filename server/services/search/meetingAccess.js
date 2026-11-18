const mongoose = require('mongoose');
const Meeting = require('../../models/Meeting');

/**
 * Per-user access control for vector search.
 *
 * Qdrant points only carry `meetingId` in their payload (no owner), so every
 * vector query must be restricted to the meetings the requesting user owns.
 * Without this filter a search returns chunks from every user's meetings.
 */

const getOwnedMeetingIds = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return [];
  const docs = await Meeting.find({ uploadedBy: userId }).select('_id').lean();
  return docs.map((d) => String(d._id));
};

/**
 * Builds a Qdrant `must` condition restricting results to the user's meetings.
 * If `meetingId` is given, it must belong to the user.
 *
 * @returns {Promise<object|null>} a Qdrant condition, or null when the user has
 *   no accessible meetings (callers must then return no results).
 */
const buildOwnershipCondition = async (userId, meetingId = null) => {
  const owned = await getOwnedMeetingIds(userId);

  if (meetingId && meetingId !== 'all') {
    const id = String(meetingId);
    if (!owned.includes(id)) return null;
    return { key: 'meetingId', match: { value: id } };
  }

  if (owned.length === 0) return null;
  return { key: 'meetingId', match: { any: owned } };
};

/** True if the user owns the meeting. */
const userOwnsMeeting = async (userId, meetingId) => {
  if (!meetingId || !mongoose.Types.ObjectId.isValid(String(meetingId))) return false;
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return false;
  return !!(await Meeting.exists({ _id: meetingId, uploadedBy: userId }));
};

module.exports = { getOwnedMeetingIds, buildOwnershipCondition, userOwnsMeeting };
