class ResponseNormalizer {
    
    normalize(data) {
        if (!data || typeof data !== "object") return data;

        const cleanString = (str) => {
            if (typeof str !== "string") return "";
            return str.trim();
        };

        const cleanArray = (arr) => {
            return Array.isArray(arr) ? arr : [];
        };

        const normalizePriority = (prio) => {
            if (!prio) return "Medium";
            const lower = String(prio).toLowerCase().trim();
            if (lower === "high") return "High";
            if (lower === "low") return "Low";
            return "Medium";
        };

        const normalizeDeadline = (deadline) => {
            return cleanString(deadline);
        };

        return {
            overview: cleanString(data.overview),
            summary: cleanString(data.summary),
            summaryPoints: cleanArray(data.summaryPoints),
            agenda: cleanArray(data.agenda),
            discussionPoints: cleanArray(data.discussionPoints),
            decisions: cleanArray(data.decisions),
            actionItems: cleanArray(data.actionItems).map(item => ({
                task: cleanString(item.task),
                owner: cleanString(item.owner),
                deadline: normalizeDeadline(item.deadline),
                priority: normalizePriority(item.priority),
                status: item.status ? cleanString(item.status) : "Pending"
            })),
            risks: cleanArray(data.risks),
            questions: {
                answered: cleanArray(data?.questions?.answered),
                unanswered: cleanArray(data?.questions?.unanswered)
            },
            keywords: cleanArray(data.keywords),
            people: cleanArray(data.people),
            organizations: cleanArray(data.organizations),
            technologies: cleanArray(data.technologies),
            meetingType: cleanString(data.meetingType),
            followUpRequired: Boolean(data.followUpRequired),
            followUpReason: cleanString(data.followUpReason)
        };
    }
}

module.exports = new ResponseNormalizer();
