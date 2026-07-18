class ResponseNormalizer {
    
    normalize(data) {
        if (!data || typeof data !== "object") return data;

        const cleanString = (str) => {
            if (typeof str !== "string") return "";
            return str.trim();
        };

        const cleanArray = (arr) => {
            return Array.isArray(arr) ? arr.map(cleanString).filter(Boolean) : [];
        };

        const deduplicate = (arr) => {
            return [...new Set(arr.map(s => s.toLowerCase()))].map(lower => {
                return arr.find(s => s.toLowerCase() === lower);
            });
        };

        const sortArray = (arr) => {
            return [...arr].sort((a, b) => a.localeCompare(b));
        };

        const processList = (arr) => sortArray(deduplicate(cleanArray(arr)));

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

        // Filter out empty action items
        const rawActionItems = Array.isArray(data.actionItems) ? data.actionItems : [];
        const actionItems = rawActionItems.map(item => ({
            task: cleanString(item.task),
            owner: cleanString(item.owner),
            deadline: normalizeDeadline(item.deadline),
            priority: normalizePriority(item.priority),
            status: item.status ? cleanString(item.status) : "Pending"
        })).filter(item => item.task !== "");

        return {
            overview: cleanString(data.overview),
            summary: cleanString(data.summary),
            summaryPoints: cleanArray(data.summaryPoints),
            agenda: processList(data.agenda),
            discussionPoints: processList(data.discussionPoints),
            decisions: cleanArray(data.decisions),
            actionItems,
            risks: cleanArray(data.risks),
            questions: {
                answered: cleanArray(data?.questions?.answered),
                unanswered: cleanArray(data?.questions?.unanswered)
            },
            keywords: processList(data.keywords),
            people: processList(data.people),
            organizations: processList(data.organizations),
            technologies: processList(data.technologies),
            meetingType: cleanString(data.meetingType),
            followUpRequired: Boolean(data.followUpRequired),
            followUpReason: cleanString(data.followUpReason)
        };
    }
}

module.exports = new ResponseNormalizer();
