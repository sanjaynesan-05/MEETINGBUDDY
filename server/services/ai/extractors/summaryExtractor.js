const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = \
You are an AI meeting assistant. Extract the overview, summary, and summary points from the transcript.
Return ONLY valid JSON. Do not hallucinate.

{
  "overview": "One concise sentence describing the meeting.",
  "summary": "A professional executive summary (100-200 words).",
  "summaryPoints": ["Point 1", "Point 2"]
}

Transcript:
{{TRANSCRIPT}}
\;

class SummaryExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript);
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new SummaryExtractor();
