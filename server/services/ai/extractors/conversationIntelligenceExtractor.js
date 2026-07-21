const ai = require("../ollama.service");
const parser = require("../parser/jsonParser");

const PROMPT = `
You are an AI meeting assistant. Analyze the transcript to extract conversation intelligence insights.
Return ONLY valid JSON. Do not hallucinate.

{
  "aiInsights": {
    "sentiment": {
      "overall": "Positive, Negative, or Neutral",
      "score": 0.91
    },
    "emotion": {
      "primary": "Primary emotion (e.g., Confident)",
      "secondary": "Secondary emotion (e.g., Collaborative)"
    },
    "intent": "Meeting intent (e.g., Planning, Review, Brainstorming)",
    "meetingTone": "Tone of the meeting (e.g., Professional, Casual)",
    "engagement": {
      "level": "High, Medium, or Low",
      "score": 88
    },
    "confidence": 94
  }
}

Transcript:
{{TRANSCRIPT}}
`;

class ConversationIntelligenceExtractor {
    async extract(transcript) {
        const prompt = PROMPT.replace("{{TRANSCRIPT}}", transcript);
        const response = await ai.chat(prompt);
        return parser.parse(response);
    }
}

module.exports = new ConversationIntelligenceExtractor();
