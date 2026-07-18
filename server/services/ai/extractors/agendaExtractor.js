const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = \
You are an AI meeting assistant. Extract the agenda items and major discussion points from the transcript.
Be specific and comprehensive. Do not use generic terms like "Team Updates".
Return ONLY valid JSON. Do not hallucinate.

{
  "agenda": ["Specific topic 1", "Specific topic 2"],
  "discussionPoints": ["Detailed point 1", "Detailed point 2"]
}

Transcript:
{{TRANSCRIPT}}
\;

class AgendaExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript);
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new AgendaExtractor();
