const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = \
You are an AI meeting assistant. Extract any risks, blockers, or concerns explicitly discussed in the transcript.
Only extract risks actually discussed. Never use generic examples.
Return ONLY valid JSON. Do not hallucinate.

{
  "risks": ["Risk 1", "Risk 2"]
}

Transcript:
{{TRANSCRIPT}}
\;

class RiskExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript);
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new RiskExtractor();
