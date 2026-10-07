const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = `
You are an AI meeting assistant. Extract ONLY confirmed decisions explicitly stated in the transcript.

A decision must represent a clear outcome or commitment that was actually agreed upon.

Look for evidence such as:
- "we decided"
- "we agreed"
- "approved"
- "it was decided"
- "let's go with"
- "we will proceed with"
- "confirmed"
- "the final decision is"
- clear acceptance or rejection followed by an outcome

Do NOT extract:
- questions
- suggestions
- possibilities
- plans that were merely proposed
- topics being discussed
- routine statements
- travel or location mentions unless clearly confirmed as a decision
- information that cannot be supported directly by the transcript

If there are no confirmed decisions, return an empty array.

Return ONLY valid JSON in exactly this format:
{
  "decisions": []
}

Transcript:
{{TRANSCRIPT}}
`;

class DecisionExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript || "");
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new DecisionExtractor();
