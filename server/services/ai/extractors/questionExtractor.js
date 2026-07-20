const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = `
You are an AI meeting assistant. Extract all questions asked during the meeting.
Categorize them as "answered" if an answer was provided, or "unanswered" if no clear answer was given.
Return ONLY valid JSON. Do not hallucinate.

{
  "questions": {
    "answered": ["Answered question 1"],
    "unanswered": ["Unanswered question 1"]
  }
}

Transcript:
{{TRANSCRIPT}}
`;

class QuestionExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript);
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new QuestionExtractor();
