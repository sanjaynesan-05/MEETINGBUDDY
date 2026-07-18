class MeetingSchemaValidator {
    
    // Hallucinated examples to reject
    HALLUCINATED_EXAMPLES = [
        "deploy on monday",
        "complete authentication module",
        "api rate limits could block data migration",
        "has the budget been approved",
        "finalize vendor contract"
    ];

    containsHallucination(text) {
        if (!text || typeof text !== "string") return false;
        const lower = text.toLowerCase();
        return this.HALLUCINATED_EXAMPLES.some(ex => lower.includes(ex));
    }

    validateSummary(data) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (typeof data.overview !== "string" || data.overview.trim() === "") throw new Error("Validation Error: overview must not be empty.");
        if (typeof data.summary !== "string" || data.summary.trim() === "") throw new Error("Validation Error: summary must not be empty.");
        if (!Array.isArray(data.summaryPoints)) throw new Error("Validation Error: summaryPoints must be an array.");
        return true;
    }

    validateAgenda(data) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!Array.isArray(data.agenda)) throw new Error("Validation Error: agenda must be an array.");
        if (!Array.isArray(data.discussionPoints)) throw new Error("Validation Error: discussionPoints must be an array.");
        return true;
    }

    validateDecisions(data) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!Array.isArray(data.decisions)) throw new Error("Validation Error: decisions must be an array.");
        for (const decision of data.decisions) {
            if (this.containsHallucination(decision)) throw new Error("Validation Error: Hallucinated decision detected.");
        }
        return true;
    }

    validateActionItems(data) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!Array.isArray(data.actionItems)) throw new Error("Validation Error: actionItems must be an array.");
        for (const item of data.actionItems) {
            if (typeof item.task !== "string") throw new Error("Action item missing valid task");
            if (typeof item.owner !== "string") throw new Error("Action item missing valid owner");
            if (typeof item.priority !== "string") throw new Error("Action item missing valid priority");
            if (this.containsHallucination(item.task)) throw new Error("Validation Error: Hallucinated action item detected.");
        }
        return true;
    }

    validateRisks(data) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!Array.isArray(data.risks)) throw new Error("Validation Error: risks must be an array.");
        for (const risk of data.risks) {
            if (this.containsHallucination(risk)) throw new Error("Validation Error: Hallucinated risk detected.");
        }
        return true;
    }

    validateQuestions(data) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!data.questions || typeof data.questions !== "object") throw new Error("Missing required object field: questions");
        if (!Array.isArray(data.questions.answered) || !Array.isArray(data.questions.unanswered)) {
            throw new Error("Questions object must contain 'answered' and 'unanswered' arrays.");
        }
        for (const q of [...data.questions.answered, ...data.questions.unanswered]) {
            if (this.containsHallucination(q)) throw new Error("Validation Error: Hallucinated question detected.");
        }
        return true;
    }

    validateEntities(data) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!Array.isArray(data.people)) throw new Error("Validation Error: people must be an array.");
        if (!Array.isArray(data.organizations)) throw new Error("Validation Error: organizations must be an array.");
        if (!Array.isArray(data.technologies)) throw new Error("Validation Error: technologies must be an array.");
        if (!Array.isArray(data.keywords)) throw new Error("Validation Error: keywords must be an array.");
        return true;
    }

    validateClassifier(data) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (typeof data.meetingType !== "string") throw new Error("Validation Error: meetingType must be a string.");
        if (typeof data.followUpRequired !== "boolean") throw new Error("Validation Error: followUpRequired must be a boolean.");
        return true;
    }

    // Retained for backward compatibility if needed, but not used in modular pipeline
    validate(data) {
        this.validateSummary(data);
        this.validateAgenda(data);
        this.validateDecisions(data);
        this.validateActionItems(data);
        this.validateRisks(data);
        this.validateQuestions(data);
        this.validateEntities(data);
        this.validateClassifier(data);
        return true;
    }
}

module.exports = new MeetingSchemaValidator();