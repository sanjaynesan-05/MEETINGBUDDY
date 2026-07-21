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

        const normalizeScore = (val) => {
            const num = parseFloat(val);
            if (isNaN(num)) return 0;
            return Math.max(0, Math.min(1, num));
        };

        const normalizePercent = (val) => {
            const num = parseInt(val, 10);
            if (isNaN(num)) return 0;
            return Math.max(0, Math.min(100, num));
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
            followUpReason: cleanString(data.followUpReason),
            aiInsights: {
                sentiment: {
                    overall: cleanString(data?.aiInsights?.sentiment?.overall) || "Neutral",
                    score: normalizeScore(data?.aiInsights?.sentiment?.score)
                },
                emotion: {
                    primary: cleanString(data?.aiInsights?.emotion?.primary) || "Neutral",
                    secondary: cleanString(data?.aiInsights?.emotion?.secondary) || "None"
                },
                intent: cleanString(data?.aiInsights?.intent) || "Unknown",
                meetingTone: cleanString(data?.aiInsights?.meetingTone) || "Neutral",
                engagement: {
                    level: cleanString(data?.aiInsights?.engagement?.level) || "Medium",
                    score: normalizePercent(data?.aiInsights?.engagement?.score)
                },
                confidence: normalizePercent(data?.aiInsights?.confidence)
            }
        };
    }
}

module.exports = new ResponseNormalizer();
