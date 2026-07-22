const Meeting = require('../../models/Meeting');
const chunkingService = require('./chunking.service');
const embeddingProviderFactory = require('./embedding.factory');
const embeddingStorage = require('./embedding.storage');
const qdrantStorage = require('./qdrantStorage');
const { MAX_BATCH_SIZE, RETRY_LIMIT, RETRY_DELAY_MS } = require('./embedding.constants');

class EmbeddingService {
  /**
   * Primary entrypoint to process embeddings for a meeting transcript.
   *
   * @param {string} meetingId
   * @param {string} transcriptText
   * @param {Object} [options] - Additional chunking or provider options
   * @returns {Promise<Object>} Summary of processing results
   */
  async processMeetingEmbeddings(meetingId, transcriptText, options = {}) {
    const startTime = Date.now();
    let stats = {
      chunksCreated: 0,
      chunksSkipped: 0,
      embeddingsGenerated: 0,
      generationTimeMs: 0,
      failures: 0,
    };

    if (!meetingId || !transcriptText || !transcriptText.trim()) {
      console.log(`[EmbeddingService] Skipped processing for meeting ${meetingId} (Empty transcript)`);
      return stats;
    }

    try {
      // 1. Update Meeting embeddingStatus to processing
      await Meeting.findByIdAndUpdate(meetingId, { embeddingStatus: 'processing' }).catch((err) =>
        console.error(`Failed to update status for ${meetingId}:`, err.message)
      );

      // 2. Intelligently chunk the transcript
      const chunks = chunkingService.chunkTranscript(meetingId, transcriptText, options);
      stats.chunksCreated = chunks.length;

      if (chunks.length === 0) {
        await Meeting.findByIdAndUpdate(meetingId, { embeddingStatus: 'completed' });
        return stats;
      }

      // 3. Fetch existing stored chunks for incremental processing check
      const existingChunks = await embeddingStorage.getExistingChunks(meetingId);
      const existingMap = new Map(existingChunks.map((c) => [c.chunkId, c]));

      const chunksToGenerate = [];
      for (const chunk of chunks) {
        const existing = existingMap.get(chunk.chunkId);
        if (embeddingStorage.shouldRegenerate(existing, chunk.contentHash, chunk.chunkVersion)) {
          chunksToGenerate.push(chunk);
        } else {
          stats.chunksSkipped++;
        }
      }

      if (chunksToGenerate.length === 0) {
        console.log(`[EmbeddingService] Meeting ${meetingId}: All ${stats.chunksCreated} chunks skipped (Up-to-date)`);
        await Meeting.findByIdAndUpdate(meetingId, { embeddingStatus: 'completed' });
        stats.generationTimeMs = Date.now() - startTime;
        return stats;
      }

      // 4. Obtain Embedding Provider via Factory
      const provider = embeddingProviderFactory.getProvider(options.provider, {
        model: options.model,
        dimensions: options.dimensions,
      });

      // 5. Batch and process embedding requests in parallel batches
      const batches = [];
      for (let i = 0; i < chunksToGenerate.length; i += MAX_BATCH_SIZE) {
        batches.push(chunksToGenerate.slice(i, i + MAX_BATCH_SIZE));
      }

      const chunksWithEmbeddings = [];

      for (const batch of batches) {
        const batchTexts = batch.map((c) => c.text);
        let vectors = [];
        let attempts = 0;
        let success = false;

        while (attempts < RETRY_LIMIT && !success) {
          try {
            attempts++;
            vectors = await provider.generateEmbeddings(batchTexts);
            success = true;
          } catch (err) {
            console.error(
              `[EmbeddingService] Batch generation attempt ${attempts}/${RETRY_LIMIT} failed for meeting ${meetingId}:`,
              err.message
            );
            if (attempts >= RETRY_LIMIT) {
              stats.failures += batch.length;
              throw err;
            }
            await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
          }
        }

        // Attach vector payload to chunk items
        batch.forEach((chunkItem, idx) => {
          const vectorData = vectors[idx];
          chunksWithEmbeddings.push({
            ...chunkItem,
            embedding: {
              vector: vectorData.vector,
              model: provider.model,
              provider: provider.name,
              dimensions: vectorData.dimensions,
              generatedAt: new Date(),
            },
          });
          stats.embeddingsGenerated++;
        });
      }

      // 6. Persist generated embeddings to MongoDB
      await embeddingStorage.saveChunks(chunksWithEmbeddings);

      // 7. Upsert to Qdrant for vector search
      try {
        await qdrantStorage.upsertChunks(chunksWithEmbeddings);
        console.log(`[EmbeddingService] Indexed ${chunksWithEmbeddings.length} vectors in Qdrant`);
      } catch (qdrantErr) {
        console.error(`[EmbeddingService] Qdrant upsert failed (non-fatal):`, qdrantErr.message);
      }

      // 8. Mark status completed
      await Meeting.findByIdAndUpdate(meetingId, { embeddingStatus: 'completed' });

      stats.generationTimeMs = Date.now() - startTime;
      console.log(
        `[EmbeddingService] Meeting ${meetingId} completed: Chunks Created=${stats.chunksCreated}, Skipped=${stats.chunksSkipped}, Generated=${stats.embeddingsGenerated}, Failures=${stats.failures}, Time=${stats.generationTimeMs}ms`
      );

      return stats;
    } catch (error) {
      console.error(`❌ [EmbeddingService] Failed generating embeddings for meeting ${meetingId}:`, error.message);
      stats.failures = stats.chunksCreated - stats.chunksSkipped - stats.embeddingsGenerated;
      stats.generationTimeMs = Date.now() - startTime;

      // Set status to failed non-fatally
      await Meeting.findByIdAndUpdate(meetingId, { embeddingStatus: 'failed' }).catch(() => {});
      return stats;
    }
  }
}

module.exports = new EmbeddingService();
