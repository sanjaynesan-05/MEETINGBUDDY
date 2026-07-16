class MeetingSchemaValidator {

    validate(data) {

        if (!data || typeof data !== "object") {
            throw new Error("AI response is not a valid object.");
        }

        const requiredFields = [
            "overview",
            "summary",
            "agenda",
            "discussionPoints",
            "decisions",
            "actionItems",
            "risks",
            "questions",
            "keywords",
            "meetingType",
            "followUpRequired",
            "followUpReason"
        ];

        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        return true;
    }

}

module.exports = new MeetingSchemaValidator();