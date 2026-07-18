const { default: ollama } = require("ollama");

class OllamaService {
    constructor() {
        this.model = process.env.OLLAMA_MODEL || "llama3.1:8b";
        this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

        this.defaultOptions = {
            temperature: 0,
            num_ctx: 16384,
        };
    }

    async checkModelAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error("Ollama server is not responding correctly.");
            }
            const data = await response.json();
            const models = data.models || [];
            const modelExists = models.some((m) => m.name === this.model || m.name === `${this.model}:latest`);
            
            if (!modelExists) {
                const installedModels = models.map(m => m.name).join(", ");
                throw new Error(`\nConfigured model:\n${this.model}\n\nInstalled models:\n${installedModels || "None"}\n\nSuggested fix:\nollama pull ${this.model}`);
            }
        } catch (error) {
            if (error.cause && error.cause.code === 'ECONNREFUSED' || (error.message && error.message.includes('fetch failed'))) {
                throw new Error("Ollama server is unreachable. Is Ollama running?");
            }
            throw error;
        }
    }

    /**
     * Generic chat method
     * @param {string} prompt
     * @param {Object} options - Override default Ollama options
     * @returns {Promise<string>}
     */
    async chat(prompt, options = {}) {
        await this.checkModelAvailability();
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