const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = `
You are an AI meeting assistant. Extract all action items (tasks) from the transcript.
Only extract actual tasks. Identify the owner and the deadline if mentioned.
Valid priorities: "High", "Medium", "Low".
Return ONLY valid JSON. Do not hallucinate.

{
  "actionItems": [
    {
      "task": "Specific task description",
      "owner": "Name of person responsible",
      "deadline": "When it is due",
      "priority": "Medium",
      "status": "Pending"
    }
  ]
}

Transcript:
{{TRANSCRIPT}}
`;

class ActionItemExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript);
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new ActionItemExtractor();
