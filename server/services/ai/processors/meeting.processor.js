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
const conversationIntelligenceExtractor = require("../extractors/conversationIntelligenceExtractor");

class MeetingProcessor {
    async analyze(transcript) {
        console.log("Starting Modular Meeting Processor pipeline...");
        const startTime = Date.now();

        // Truncate to save context window and avoid OOM
        const maxChars = parseInt(process.env.MAX_CONTEXT_CHARACTERS || process.env.MAX_CONTEXT || "24000", 10);
        const processingTranscript = transcript.length > maxChars 
            ? transcript.substring(0, maxChars) + "\n...[TRUNCATED]" 
            : transcript;
        console.log(`Transcript length: ${transcript.length} chars. Processing: ${processingTranscript.length} chars.`);

        // Default empty structure
        let finalJson = {
            overview: "", summary: "", summaryPoints: [], agenda: [], discussionPoints: [],
            decisions: [], actionItems: [], risks: [], questions: { answered: [], unanswered: [] },
            keywords: [], people: [], organizations: [], technologies: [], meetingType: "", followUpRequired: false, followUpReason: "",
            aiInsights: { sentiment: {}, emotion: {}, intent: "", meetingTone: "", engagement: {}, confidence: 0 }
        };

        const metrics = {
            stages: [],
            totalInferenceTime: 0,
            totalValidationTime: 0,
            normalizationTime: 0,
            totalPipelineTime: 0
        };

        const runStage = async (name, extractor, validateFn, mergeFn) => {
            const stageStart = Date.now();
            let stageInferenceTime = 0;
            let stageValidationTime = 0;
            try {
                const result = await retryHandler.withRetry(async () => {
                    const infStart = Date.now();
                    const data = await extractor.extract(processingTranscript);
                    stageInferenceTime += (Date.now() - infStart);

                    const valStart = Date.now();
                    validateFn(data);
                    stageValidationTime += (Date.now() - valStart);

                    return data;
                }, null, 2000); // maxAttempts = null (uses .env)
                mergeFn(result);
                const duration = Date.now() - stageStart;

                metrics.totalInferenceTime += stageInferenceTime;
                metrics.totalValidationTime += stageValidationTime;
                metrics.stages.push({
                    name,
                    inferenceTime: stageInferenceTime,
                    validationTime: stageValidationTime,
                    totalTime: duration,
                    status: 'Success'
                });

                console.log(`${name} ✓ (${duration}ms)`);
            } catch (error) {
                const duration = Date.now() - stageStart;

                metrics.totalInferenceTime += stageInferenceTime;
                metrics.totalValidationTime += stageValidationTime;
                metrics.stages.push({
                    name,
                    inferenceTime: stageInferenceTime,
                    validationTime: stageValidationTime,
                    totalTime: duration,
                    status: 'Failed'
                });

                console.error(`❌ Failed to extract ${name} after ${duration}ms:`, error.message);
                // Fallback will use the default values initialized in finalJson
            }
        };

        try {
            // Parallel execution for better performance
            await Promise.all([
                runStage("Summary Extraction", summaryExtractor, (d) => validator.validateSummary(d, processingTranscript), (d) => {
                    finalJson.overview = d.overview || ""; finalJson.summary = d.summary || ""; finalJson.summaryPoints = d.summaryPoints || [];
                }),
                runStage("Agenda Extraction", agendaExtractor, (d) => validator.validateAgenda(d, processingTranscript), (d) => {
                    finalJson.agenda = d.agenda || []; finalJson.discussionPoints = d.discussionPoints || [];
                }),
                runStage("Decision Extraction", decisionExtractor, (d) => validator.validateDecisions(d, processingTranscript), (d) => {
                    finalJson.decisions = d.decisions || [];
                }),
                runStage("Action Item Extraction", actionItemExtractor, (d) => validator.validateActionItems(d, processingTranscript), (d) => {
                    finalJson.actionItems = d.actionItems || [];
                }),
                runStage("Risk Extraction", riskExtractor, (d) => validator.validateRisks(d, processingTranscript), (d) => {
                    finalJson.risks = d.risks || [];
                }),
                runStage("Question Extraction", questionExtractor, (d) => validator.validateQuestions(d, processingTranscript), (d) => {
                    finalJson.questions = d.questions || { answered: [], unanswered: [] };
                }),
                runStage("Entity Extraction", entityExtractor, (d) => validator.validateEntities(d), (d) => {
                    finalJson.keywords = d.keywords || []; finalJson.people = d.people || []; finalJson.organizations = d.organizations || []; finalJson.technologies = d.technologies || [];
                }),
                runStage("Classifier", classifierExtractor, (d) => validator.validateClassifier(d), (d) => {
                    finalJson.meetingType = d.meetingType || ""; finalJson.followUpRequired = d.followUpRequired || false; finalJson.followUpReason = d.followUpReason || "";
                }),
                runStage("Conversation Intelligence", conversationIntelligenceExtractor, (d) => validator.validateConversationIntelligence(d), (d) => {
                    finalJson.aiInsights = d.aiInsights || { sentiment: {}, emotion: {}, intent: "", meetingTone: "", engagement: {}, confidence: 0 };
                })
            ]);

            const normStart = Date.now();
            console.log("Normalization ✓");
            const normalized = normalizer.normalize(finalJson);
            metrics.normalizationTime = Date.now() - normStart;
            
            console.log("Validation ✓");

            const executionTime = Date.now() - startTime;
            metrics.totalPipelineTime = executionTime;
            console.log(`Pipeline Completed in ${executionTime}ms`);
            console.log("Final JSON Saved ✓");

            console.log("\n==================================================");
            console.log("           PIPELINE PERFORMANCE REPORT");
            console.log("==================================================");
            console.log(`Total Pipeline Time:   ${metrics.totalPipelineTime}ms`);
            console.log(`Total Inference Time:  ${metrics.totalInferenceTime}ms`);
            console.log(`Total Validation Time: ${metrics.totalValidationTime}ms`);
            console.log(`Normalization Time:    ${metrics.normalizationTime}ms`);
            console.log("--------------------------------------------------");
            console.log("STAGE BREAKDOWN:");
            metrics.stages.forEach(s => {
                console.log(`- ${s.name}:`);
                console.log(`    Status:     ${s.status}`);
                console.log(`    Inference:  ${s.inferenceTime}ms`);
                console.log(`    Validation: ${s.validationTime}ms`);
                console.log(`    Total:      ${s.totalTime}ms`);
            });
            console.log("==================================================\n");

            return normalized;
        } catch (error) {
            console.error("Meeting Processor Error");
            console.error("Total Pipeline Execution Time before failure:", Date.now() - startTime, "ms");
            throw error;
        }
    }
}

module.exports = new MeetingProcessor();
