const Meeting = require('../../models/Meeting');
const chunkingService = require('./chunking.service');
const embeddingProviderFactory = require('./embedding.factory');
const embeddingStorage = require('./embedding.storage');
const qdrantStorage = require('./qdrantStorage');
const {
  MAX_BATCH_SIZE,
  RETRY_LIMIT,
  RETRY_DELAY_MS,
} = require('./embedding.constants');

class EmbeddingService {
  /**
   * Primary entrypoint to process embeddings for a meeting transcript.
   *
   * @param {string} meetingId
   * @param {string} transcriptText
   * @param {Object} [options] - Additional chunking or provider options
   * @returns {Promise<Object>} Summary of processing results
   */
  async processMeetingEmbeddings(
    meetingId,
    transcriptText,
    options = {}
  ) {
    const startTime = Date.now();

    let stats = {
      chunksCreated: 0,
      chunksSkipped: 0,
      embeddingsGenerated: 0,
      generationTimeMs: 0,
      failures: 0,
    };

    if (
      !meetingId ||
      !transcriptText ||
      !transcriptText.trim()
    ) {
      console.log(
        `[EmbeddingService] Skipped processing for meeting ${meetingId} (Empty transcript)`
      );

      return stats;
    }

    try {
      // ---------------------------------------------------------
      // 1. Update Meeting embedding status
      // ---------------------------------------------------------

      await Meeting.findByIdAndUpdate(
        meetingId,
        {
          embeddingStatus: 'processing',
        }
      ).catch((err) =>
        console.error(
          `Failed to update status for ${meetingId}:`,
          err.message
        )
      );

      // ---------------------------------------------------------
      // 2. Chunk transcript
      // ---------------------------------------------------------

      const chunks =
        chunkingService.chunkTranscript(
          meetingId,
          transcriptText,
          options
        );

      stats.chunksCreated = chunks.length;

      if (chunks.length === 0) {
        await Meeting.findByIdAndUpdate(
          meetingId,
          {
            embeddingStatus: 'completed',
          }
        );

        stats.generationTimeMs =
          Date.now() - startTime;

        return stats;
      }

      // ---------------------------------------------------------
      // 3. Check existing MongoDB chunks
      // ---------------------------------------------------------

      const existingChunks =
        await embeddingStorage.getExistingChunks(
          meetingId
        );

      const existingMap = new Map(
        existingChunks.map((c) => [
          c.chunkId,
          c,
        ])
      );

      const chunksToGenerate = [];

      // IMPORTANT:
      // Existing chunks with valid embeddings are also
      // collected for Qdrant synchronization.
      const chunksToIndex = [];

      for (const chunk of chunks) {
        const existing =
          existingMap.get(chunk.chunkId);

        if (
          embeddingStorage.shouldRegenerate(
            existing,
            chunk.contentHash,
            chunk.chunkVersion
          )
        ) {
          // Needs a new embedding.
          chunksToGenerate.push(chunk);
        } else {
          // MongoDB embedding is already valid.
          stats.chunksSkipped++;

          // Reuse the existing MongoDB embedding and
          // synchronize it to Qdrant.
          if (
            existing &&
            existing.embedding &&
            Array.isArray(
              existing.embedding.vector
            ) &&
            existing.embedding.vector.length > 0
          ) {
            chunksToIndex.push({
              ...chunk,

              embedding: {
                vector:
                  existing.embedding.vector,

                model:
                  existing.embedding.model,

                provider:
                  existing.embedding.provider,

                dimensions:
                  existing.embedding.dimensions ||
                  existing.embedding.vector.length,

                generatedAt:
                  existing.embedding.generatedAt,
              },
            });
          }
        }
      }

      // ---------------------------------------------------------
      // 4. Generate missing/new embeddings
      // ---------------------------------------------------------

      if (chunksToGenerate.length > 0) {
        const provider =
          embeddingProviderFactory.getProvider(
            options.provider,
            {
              model: options.model,
              dimensions: options.dimensions,
            }
          );

        // Create batches.
        const batches = [];

        for (
          let i = 0;
          i < chunksToGenerate.length;
          i += MAX_BATCH_SIZE
        ) {
          batches.push(
            chunksToGenerate.slice(
              i,
              i + MAX_BATCH_SIZE
            )
          );
        }

        const newlyGeneratedChunks = [];

        // -------------------------------------------------------
        // Generate embeddings batch-by-batch
        // -------------------------------------------------------

        for (const batch of batches) {
          const batchTexts =
            batch.map((c) => c.text);

          let vectors = [];
          let attempts = 0;
          let success = false;

          while (
            attempts < RETRY_LIMIT &&
            !success
          ) {
            try {
              attempts++;

              vectors =
                await provider.generateEmbeddings(
                  batchTexts
                );

              success = true;
            } catch (err) {
              console.error(
                `[EmbeddingService] Batch generation attempt ${attempts}/${RETRY_LIMIT} failed for meeting ${meetingId}:`,
                err.message
              );

              if (
                attempts >= RETRY_LIMIT
              ) {
                stats.failures +=
                  batch.length;

                throw err;
              }

              await new Promise(
                (resolve) =>
                  setTimeout(
                    resolve,
                    RETRY_DELAY_MS
                  )
              );
            }
          }

          // -----------------------------------------------------
          // Attach generated vectors
          // -----------------------------------------------------

          batch.forEach(
            (chunkItem, idx) => {
              const vectorData =
                vectors[idx];

              const chunkWithEmbedding = {
                ...chunkItem,

                embedding: {
                  vector:
                    vectorData.vector,

                  model:
                    provider.model,

                  provider:
                    provider.name,

                  dimensions:
                    vectorData.dimensions,

                  generatedAt:
                    new Date(),
                },
              };

              newlyGeneratedChunks.push(
                chunkWithEmbedding
              );

              stats.embeddingsGenerated++;
            }
          );
        }

        // Add newly generated chunks to the
        // Qdrant synchronization list.
        chunksToIndex.push(
          ...newlyGeneratedChunks
        );

        // -------------------------------------------------------
        // 5. Save newly generated embeddings to MongoDB
        // -------------------------------------------------------

        if (
          newlyGeneratedChunks.length > 0
        ) {
          await embeddingStorage.saveChunks(
            newlyGeneratedChunks
          );
        }
      }

      // ---------------------------------------------------------
      // 6. Synchronize ALL available embeddings to Qdrant
      // ---------------------------------------------------------

      if (chunksToIndex.length > 0) {
        try {
          const indexed =
            await qdrantStorage.upsertChunks(
              chunksToIndex
            );

          console.log(
            `[EmbeddingService] Indexed ${indexed} vectors in Qdrant`
          );
        } catch (qdrantErr) {
          console.error(
            `[EmbeddingService] Qdrant upsert failed (non-fatal):`,
            qdrantErr.message
          );
        }
      } else {
        console.log(
          `[EmbeddingService] No embeddings available for Qdrant indexing`
        );
      }

      // ---------------------------------------------------------
      // 7. Mark completed
      // ---------------------------------------------------------

      await Meeting.findByIdAndUpdate(
        meetingId,
        {
          embeddingStatus: 'completed',
        }
      );

      stats.generationTimeMs =
        Date.now() - startTime;

      console.log(
        `[EmbeddingService] Meeting ${meetingId} completed: ` +
          `Chunks Created=${stats.chunksCreated}, ` +
          `Skipped=${stats.chunksSkipped}, ` +
          `Generated=${stats.embeddingsGenerated}, ` +
          `Failures=${stats.failures}, ` +
          `Time=${stats.generationTimeMs}ms`
      );

      return stats;
    } catch (error) {
      console.error(
        `[EmbeddingService] Failed generating embeddings for meeting ${meetingId}:`,
        error.message
      );

      stats.failures =
        stats.chunksCreated -
        stats.chunksSkipped -
        stats.embeddingsGenerated;

      stats.generationTimeMs =
        Date.now() - startTime;

      await Meeting.findByIdAndUpdate(
        meetingId,
        {
          embeddingStatus: 'failed',
        }
      ).catch(() => {});

      return stats;
    }
  }
}

module.exports = new EmbeddingService();