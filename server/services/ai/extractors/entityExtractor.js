const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = `
You are an AI meeting assistant. Extract people, organizations, technologies, and keywords from the transcript.
- people: Full names of participants or people mentioned.
- organizations: Companies, vendors, partners, or departments mentioned.
- technologies: Software, tools, technical concepts, or frameworks mentioned.
- keywords: Meaningful, searchable keywords (avoid generic terms).
Return ONLY valid JSON. Do not hallucinate.

{
  "people": ["Person 1"],
  "organizations": ["Org 1"],
  "technologies": ["Tech 1"],
  "keywords": ["Keyword 1"]
}

Transcript:
{{TRANSCRIPT}}
`;

class EntityExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript);
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new EntityExtractor();
