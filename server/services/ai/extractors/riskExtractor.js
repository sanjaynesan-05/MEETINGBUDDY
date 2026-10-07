const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = `
You are an AI meeting assistant. Extract ONLY genuine risks, blockers, unresolved concerns, or potential problems explicitly supported by the transcript.

A risk must have evidence that it could negatively affect a project, decision, meeting outcome, schedule, resource, compliance, security, or other objective.

Look for statements indicating:
- a blocker
- a potential failure
- an unresolved problem
- a threat or concern
- a dependency that may cause problems
- a delay or resource problem
- security, compliance, technical, financial, or operational risk
- uncertainty explicitly presented as a problem

Do NOT extract:
- normal questions
- ordinary conversation
- random statements
- travel plans
- locations
- personal information
- completed actions
- suggestions unless explicitly described as a risk
- vague or unrelated concerns
- anything not supported by the transcript

If there are no genuine risks, return an empty array.

Return ONLY valid JSON in exactly this format:
{
  "risks": []
}

Transcript:
{{TRANSCRIPT}}
`;

class RiskExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript || "");
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new RiskExtractor();
