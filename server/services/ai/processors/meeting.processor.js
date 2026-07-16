const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");
const validator = require("../validators/meetingSchema");

const {
    MASTER_MEETING_PROMPT
} = require("../promptTemplates");

class MeetingProcessor {

    async analyze(transcript) {

        try {

            // Build Prompt
            const prompt = MASTER_MEETING_PROMPT.replace(
                "{{TRANSCRIPT}}",
                transcript
            );

            // AI Response
            const response = await ai.chat(prompt);

            // Parse JSON
            const meeting = parser.parse(response);

            // Validate
            validator.validate(meeting);

            return meeting;

        } catch (error) {

            console.error("Meeting Processor Error");
            throw error;

        }

    }

}

module.exports = new MeetingProcessor();