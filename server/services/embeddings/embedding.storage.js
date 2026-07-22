const MeetingChunk = require('../../models/MeetingChunk');

/**
 * Storage Layer for Meeting Chunks & Embeddings
 */
class EmbeddingStorage {
  /**
   * Retrieve existing chunks for a meeting.
   * @param {string} meetingId
   * @returns {Promise<Array<Object>>}
   */
  async getExistingChunks(meetingId) {
    if (!meetingId) return [];
    return MeetingChunk.find({ meetingId }).lean();
  }

  /**
   * Determine if a chunk should be regenerated.
   * @param {Object|null} existingChunk
   * @param {string} newHash
   * @param {number} newVersion
   * @returns {boolean}
   */
  shouldRegenerate(existingChunk, newHash, newVersion) {
    if (!existingChunk) return true;
    if (existingChunk.contentHash !== newHash) return true;
    if (existingChunk.chunkVersion !== newVersion) return true;
    if (!existingChunk.embedding || !existingChunk.embedding.vector || existingChunk.embedding.vector.length === 0) return true;
    return false;
  }

  /**
   * Save or update multiple chunk embeddings atomically / via bulk write.
   * @param {Array<Object>} chunksWithEmbeddings
   * @returns {Promise<number>} Count of saved chunks
   */
  async saveChunks(chunksWithEmbeddings) {
    if (!chunksWithEmbeddings || chunksWithEmbeddings.length === 0) {
      return 0;
    }

    const operations = chunksWithEmbeddings.map((item) => ({
      updateOne: {
        filter: { chunkId: item.chunkId },
        update: {
          $set: {
            meetingId: item.meetingId,
            chunkId: item.chunkId,
            chunkVersion: item.chunkVersion,
            contentHash: item.contentHash,
            chunkIndex: item.chunkIndex,
            text: item.text,
            chunkType: item.chunkType,
            embedding: item.embedding,
            metadata: item.metadata,
          },
        },
        upsert: true,
      },
    }));

    const result = await MeetingChunk.bulkWrite(operations);
    return (result.upsertedCount || 0) + (result.modifiedCount || 0);
  }

  /**
   * Delete chunks for a given meeting ID (useful for reset/testing).
   * @param {string} meetingId
   * @returns {Promise<number>}
   */
  async deleteChunksForMeeting(meetingId) {
    if (!meetingId) return 0;
    const res = await MeetingChunk.deleteMany({ meetingId });
    return res.deletedCount || 0;
  }
}

module.exports = new EmbeddingStorage();
