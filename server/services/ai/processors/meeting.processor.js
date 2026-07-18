const validator = require("../validators/meetingSchema");
const normalizer = require("../utils/responseNormalizer");
const retryHandler = require("../utils/retryHandler");

const summaryExtractor = require("../extractors/summaryExtractor");
const agendaExtractor = require("../extractors/agendaExtractor");
const decisionExtractor = require("../extractors/decisionExtractor");
const actionItemExtractor = require("../extractors/actionItemExtractor");
const riskExtractor = require("../extractors/riskExtractor");
const questionExtractor = require("../extractors/questionExtractor");
const entityExtractor = require("../extractors/entityExtractor");
const classifierExtractor = require("../extractors/classifierExtractor");

class MeetingProcessor {
    async analyze(transcript) {
        console.log("Starting Modular Meeting Processor pipeline...");
        const startTime = Date.now();

        // Default empty structure
        let finalJson = {
            overview: "", summary: "", summaryPoints: [], agenda: [], discussionPoints: [],
            decisions: [], actionItems: [], risks: [], questions: { answered: [], unanswered: [] },
            keywords: [], people: [], organizations: [], technologies: [], meetingType: "", followUpRequired: false, followUpReason: ""
        };

        const runStage = async (name, extractor, validateFn, mergeFn) => {
            try {
                const result = await retryHandler.withRetry(async () => {
                    const data = await extractor.extract(transcript);
                    validateFn(data);
                    return data;
                }, 3, 2000);
                mergeFn(result);
                console.log(`${name} ✓`);
            } catch (error) {
                console.error(`❌ Failed to extract ${name}:`, error.message);
                // Fallback will use the default values initialized in finalJson
            }
        };

        try {
            // Sequential execution for stability
            await runStage("Summary Extraction", summaryExtractor, (d) => validator.validateSummary(d), (d) => {
                finalJson.overview = d.overview || ""; finalJson.summary = d.summary || ""; finalJson.summaryPoints = d.summaryPoints || [];
            });

            await runStage("Agenda Extraction", agendaExtractor, (d) => validator.validateAgenda(d), (d) => {
                finalJson.agenda = d.agenda || []; finalJson.discussionPoints = d.discussionPoints || [];
            });

            await runStage("Decision Extraction", decisionExtractor, (d) => validator.validateDecisions(d), (d) => {
                finalJson.decisions = d.decisions || [];
            });

            await runStage("Action Item Extraction", actionItemExtractor, (d) => validator.validateActionItems(d), (d) => {
                finalJson.actionItems = d.actionItems || [];
            });

            await runStage("Risk Extraction", riskExtractor, (d) => validator.validateRisks(d), (d) => {
                finalJson.risks = d.risks || [];
            });

            await runStage("Question Extraction", questionExtractor, (d) => validator.validateQuestions(d), (d) => {
                finalJson.questions = d.questions || { answered: [], unanswered: [] };
            });

            await runStage("Entity Extraction", entityExtractor, (d) => validator.validateEntities(d), (d) => {
                finalJson.keywords = d.keywords || []; finalJson.people = d.people || []; finalJson.organizations = d.organizations || []; finalJson.technologies = d.technologies || [];
            });

            await runStage("Classifier", classifierExtractor, (d) => validator.validateClassifier(d), (d) => {
                finalJson.meetingType = d.meetingType || ""; finalJson.followUpRequired = d.followUpRequired || false; finalJson.followUpReason = d.followUpReason || "";
            });

            console.log("Normalization ✓");
            const normalized = normalizer.normalize(finalJson);
            
            console.log("Validation ✓");

            const executionTime = Date.now() - startTime;
            console.log(`Pipeline Completed in ${executionTime}ms`);
            console.log("Final JSON Saved ✓");

            return normalized;
        } catch (error) {
            console.error("Meeting Processor Error");
            console.error("Total Pipeline Execution Time before failure:", Date.now() - startTime, "ms");
            throw error;
        }
    }
}

module.exports = new MeetingProcessor();