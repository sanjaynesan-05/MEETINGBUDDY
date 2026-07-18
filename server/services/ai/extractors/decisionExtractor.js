const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = \
You are an AI meeting assistant. Extract ONLY confirmed decisions from the transcript.
Include organizational changes, appointments, approved plans, adopted processes, renamed teams, and scheduled work.
Do not extract considerations or proposals that were not finalized.
Return ONLY valid JSON. Do not hallucinate.

{
  "decisions": ["Decision 1", "Decision 2"]
}

Transcript:
{{TRANSCRIPT}}
\;

class DecisionExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript);
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new DecisionExtractor();
