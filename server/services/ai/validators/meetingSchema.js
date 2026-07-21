class MeetingSchemaValidator {
    
    verifySemanticMatch(text, transcript, itemType) {
        if (!transcript) return;
        if (!text || typeof text !== "string") return;

        console.log(`${itemType} validation started.`);
        
        const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
        const transcriptLower = transcript.toLowerCase();
        
        let matchCount = 0;
        for (const word of words) {
            if (transcriptLower.includes(word)) {
                matchCount++;
            }
        }
        
        const matchRatio = words.length > 0 ? matchCount / words.length : 1;
        const confidence = (matchRatio * 100).toFixed(0);
        
        console.log(`${itemType} verified.`);
        console.log(`${itemType} confidence: ${confidence}`);
        
        if (matchRatio < 0.2 && words.length > 0) {
            console.log(`Semantic match: FAIL`);
            console.log(`Warning: ${itemType} might not be supported by transcript. (Kept to prevent data loss)`);
        } else {
            console.log(`Semantic match: PASS`);
        }
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

    validateDecisions(data, transcript) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!Array.isArray(data.decisions)) throw new Error("Validation Error: decisions must be an array.");
        
        const validDecisions = [];
        for (const decision of data.decisions) {
            if (decision && typeof decision === "string" && decision.trim() !== "") {
                this.verifySemanticMatch(decision, transcript, "Decision");
                validDecisions.push(decision);
            } else if (decision && typeof decision === "object") {
                const text = decision.decision || decision.text || "";
                if (typeof text === "string" && text.trim() !== "") {
                    this.verifySemanticMatch(text, transcript, "Decision");
                    validDecisions.push(text);
                } else {
                    console.log(`Decision rejected because of wrong datatype or null.`);
                }
            } else {
                console.log(`Decision rejected because of wrong datatype or null.`);
            }
        }
        data.decisions = validDecisions;
        return true;
    }

    validateActionItems(data, transcript) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!Array.isArray(data.actionItems)) throw new Error("Validation Error: actionItems must be an array.");
        
        const validItems = [];
        for (const item of data.actionItems) {
            if (item && typeof item === "object") {
                if (typeof item.task !== "string" || item.task.trim() === "") continue;
                if (typeof item.owner !== "string") item.owner = "";
                if (typeof item.priority !== "string") item.priority = "Medium";
                
                this.verifySemanticMatch(item.task, transcript, "Action Item");
                validItems.push(item);
            }
        }
        data.actionItems = validItems;
        return true;
    }

    validateRisks(data, transcript) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!Array.isArray(data.risks)) throw new Error("Validation Error: risks must be an array.");
        
        const validRisks = [];
        for (const risk of data.risks) {
            if (risk && typeof risk === "string" && risk.trim() !== "") {
                this.verifySemanticMatch(risk, transcript, "Risk");
                validRisks.push(risk);
            }
        }
        data.risks = validRisks;
        return true;
    }

    validateQuestions(data, transcript) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        if (!data.questions || typeof data.questions !== "object") throw new Error("Missing required object field: questions");
        if (!Array.isArray(data.questions.answered)) data.questions.answered = [];
        if (!Array.isArray(data.questions.unanswered)) data.questions.unanswered = [];
        
        const validAnswered = [];
        for (const q of data.questions.answered) {
            if (q && typeof q === "string" && q.trim() !== "") {
                this.verifySemanticMatch(q, transcript, "Question (Answered)");
                validAnswered.push(q);
            }
        }
        data.questions.answered = validAnswered;
        
        const validUnanswered = [];
        for (const q of data.questions.unanswered) {
            if (q && typeof q === "string" && q.trim() !== "") {
                this.verifySemanticMatch(q, transcript, "Question (Unanswered)");
                validUnanswered.push(q);
            }
        }
        data.questions.unanswered = validUnanswered;
        
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

    validateConversationIntelligence(data) {
        if (!data || typeof data !== "object") throw new Error("Validation Error: response is not an object.");
        const aiInsights = data.aiInsights;
        if (!aiInsights || typeof aiInsights !== "object") throw new Error("Validation Error: aiInsights must be an object.");
        if (!aiInsights.sentiment || typeof aiInsights.sentiment !== "object") throw new Error("Validation Error: sentiment must be an object.");
        if (!aiInsights.emotion || typeof aiInsights.emotion !== "object") throw new Error("Validation Error: emotion must be an object.");
        if (typeof aiInsights.intent !== "string") throw new Error("Validation Error: intent must be a string.");
        if (typeof aiInsights.meetingTone !== "string") throw new Error("Validation Error: meetingTone must be a string.");
        if (!aiInsights.engagement || typeof aiInsights.engagement !== "object") throw new Error("Validation Error: engagement must be an object.");
        if (typeof aiInsights.confidence !== "number") throw new Error("Validation Error: confidence must be a number.");
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