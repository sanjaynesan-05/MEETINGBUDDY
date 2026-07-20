const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = `
You are an AI meeting assistant. Classify the meeting type and determine if a follow-up is required.
Meeting types can be: Sprint Planning, Engineering Staff Meeting, Leadership Meeting, Project Review, Incident Review, Architecture Review, etc.
Return ONLY valid JSON. Do not hallucinate.

{
  "meetingType": "Specific Meeting Type",
  "followUpRequired": true,
  "followUpReason": "Reason for follow-up, if any"
}

Transcript:
{{TRANSCRIPT}}
`;

class ClassifierExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript);
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new ClassifierExtractor();
