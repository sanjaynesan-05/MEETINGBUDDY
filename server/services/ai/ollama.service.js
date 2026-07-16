const { default: ollama } = require("ollama");

class OllamaService {
    constructor() {
        this.model = "qwen2.5:7b";
    }

    async chat(prompt) {
        try {
            const response = await ollama.chat({
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

            return response.message.content;

        } catch (error) {
            console.error("Ollama Error:", error.message);
            throw error;
        }
    }

    async summarizeMeeting(transcript) {
        return this.chat(transcript);
    }

    async analyzeMeeting(transcript) {
        return this.chat(transcript);
    }

    async ask(question) {
        return this.chat(question);
    }
}

module.exports = new OllamaService();