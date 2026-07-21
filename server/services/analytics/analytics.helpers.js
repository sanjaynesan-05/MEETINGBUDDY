const mongoose = require('mongoose');

/**
 * Builds the initial $match stage for the aggregation pipeline.
 * @param {string} userId - The user ID to filter by.
 * @param {Object} query - Express query object containing optional `from` and `to` dates.
 * @returns {Object} MongoDB $match object.
 */
function buildMatchStage(userId, query = {}) {
  const match = {
    uploadedBy: new mongoose.Types.ObjectId(userId)
  };

  const { from, to } = query;

  if (from || to) {
    match.createdAt = {};
    if (from) {
      match.createdAt.$gte = new Date(from);
    }
    if (to) {
      // Ensure 'to' date includes the entire day
      const toDate = new Date(to);
      toDate.setUTCHours(23, 59, 59, 999);
      match.createdAt.$lte = toDate;
    }
  }

  return match;
}

/**
 * Rounds a number to a specific number of decimal places.
 * @param {number} num - The number to round.
 * @param {number} decimals - Number of decimal places (default 2).
 * @returns {number} The rounded number.
 */
function roundNumber(num, decimals = 2) {
  if (typeof num !== 'number' || isNaN(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

module.exports = {
  buildMatchStage,
  roundNumber
};
