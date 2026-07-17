const { default: ollama } = require("ollama");

class OllamaService {
    constructor() {
        this.model = process.env.OLLAMA_MODEL || "qwen2.5:7b";

        this.defaultOptions = {
            temperature: 0,
            num_ctx: 16384,
        };
    }

    /**
     * Generic chat method
     * @param {string} prompt
     * @param {Object} options - Override default Ollama options
     * @returns {Promise<string>}
     */
    async chat(prompt, options = {}) {
        try {
            const response = await ollama.chat({
                model: this.model,

                // Force structured JSON responses
                format: "json",

                // Merge default options with any overrides
                options: {
                    ...this.defaultOptions,
                    ...options,
                },

                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

            if (
                !response ||
                !response.message ||
                typeof response.message.content !== "string"
            ) {
                throw new Error("Invalid response received from Ollama.");
            }

            return response.message.content.trim();

        } catch (error) {
            console.error("======================================");
            console.error("❌ Ollama Service Error");
            console.error("Model:", this.model);
            console.error("Message:", error.message);
            console.error("======================================");

            throw error;
        }
    }
    /**
     * Meeting summarization
     */
    async summarizeMeeting(transcript) {
        return this.chat(transcript);
    }
    /**
     * Meeting intelligence extraction
     */
    async analyzeMeeting(transcript) {
        return this.chat(transcript, {
            temperature: 0,
        });
    }
    /**
     * Generic Q&A
     */
    async ask(question) {
        return this.chat(question, {
            format: undefined,
        });
    }
}

module.exports = new OllamaService();