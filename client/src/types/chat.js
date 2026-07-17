/**
 * @typedef {Object} Citation
 * @property {string} meetingId
 * @property {string} chunkId
 * @property {string} speaker
 * @property {string} startTime
 * @property {string} endTime
 * @property {number} similarityScore
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {'user' | 'assistant'} role
 * @property {string} content
 * @property {Citation[]} [citations]
 * @property {number} [confidence]
 * @property {Object} [metadata]
 * @property {string} createdAt
 */

export {};
