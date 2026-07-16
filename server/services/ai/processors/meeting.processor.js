const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");
const validator = require("../validators/meetingSchema");
const normalizer = require("../utils/responseNormalizer");
const retryHandler = require("../utils/retryHandler");

const {
    MASTER_MEETING_PROMPT
} = require("../promptTemplates");

class MeetingProcessor {

    async analyze(transcript) {
        console.log("Starting Meeting Processor pipeline...");
        const startTime = Date.now();

        try {

            // Build Prompt
            const prompt = MASTER_MEETING_PROMPT.replace(
                "{{TRANSCRIPT}}",
                transcript
            );

            console.log("\n--- RAW PROMPT ---");
            console.log(prompt);
            console.log("------------------\n");

            const meeting = await retryHandler.withRetry(async () => {
                // AI Response
                console.log("Calling AI Model...");
                const response = await ai.chat(prompt);
                
                console.log("\n--- RAW AI RESPONSE ---");
                console.log(response);
                console.log("-----------------------\n");

                // Parse JSON
                const parsed = parser.parse(response);
                
                console.log("\n--- PARSED JSON ---");
                console.log(JSON.stringify(parsed, null, 2));
                console.log("-------------------\n");

                // Normalize JSON
                const normalized = normalizer.normalize(parsed);
                
                console.log("\n--- NORMALIZED JSON ---");
                console.log(JSON.stringify(normalized, null, 2));
                console.log("-----------------------\n");

                // Validate
                validator.validate(normalized);
                console.log("Validation Successful.");
                
                return normalized;
            }, 3, 2000);

            const executionTime = Date.now() - startTime;
            console.log(`Pipeline Completed in ${executionTime}ms`);

            return meeting;

        } catch (error) {

            console.error("Meeting Processor Error");
            console.error("Total Pipeline Execution Time before failure:", Date.now() - startTime, "ms");
            throw error;

        }

    }

}

module.exports = new MeetingProcessor();