class MeetingSchemaValidator {
    validate(data) {
        if (!data || typeof data !== "object") {
            throw new Error("AI response is not a valid object.");
        }

        const requiredStringFields = [
            "overview",
            "summary",
            "meetingType"
        ];

        const requiredArrayFields = [
            "summaryPoints",
            "agenda",
            "discussionPoints",
            "decisions",
            "actionItems",
            "risks",
            "keywords",
            "people",
            "organizations",
            "technologies"
        ];

        // Validate string fields
        for (const field of requiredStringFields) {
            if (!(field in data)) {
                throw new Error(`Missing required string field: ${field}`);
            }
            if (typeof data[field] !== "string") {
                throw new Error(`Field ${field} must be a string.`);
            }
        }

        if (data.overview.trim() === "") {
             throw new Error("Validation Error: overview must not be empty.");
        }

        if (data.summary.trim() === "") {
             throw new Error("Validation Error: summary must not be empty.");
        }

        // Validate array fields
        for (const field of requiredArrayFields) {
            if (!(field in data)) {
                throw new Error(`Missing required array field: ${field}`);
            }
            if (!Array.isArray(data[field])) {
                throw new Error(`Field ${field} must be an array.`);
            }
        }

        // Validate actionItems structure
        for (const item of data.actionItems) {
            if (typeof item.task !== "string") throw new Error("Action item missing valid task");
            if (typeof item.owner !== "string") throw new Error("Action item missing valid owner");
            if (typeof item.priority !== "string") throw new Error("Action item missing valid priority");
        }

        // Validate nested questions
        if (!data.questions || typeof data.questions !== "object") {
            throw new Error(`Missing required object field: questions`);
        }

        if (!Array.isArray(data.questions.answered) || !Array.isArray(data.questions.unanswered)) {
            throw new Error(`Questions object must contain 'answered' and 'unanswered' arrays.`);
        }

        // Validate boolean
        if (typeof data.followUpRequired !== "boolean") {
            throw new Error(`Field followUpRequired must be a boolean.`);
        }

        return true;
    }
}

module.exports = new MeetingSchemaValidator();