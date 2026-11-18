const { default: ollama } = require("ollama");
const { Agent, setGlobalDispatcher } = require("undici");

// Set global dispatcher timeouts so Node's fetch won't abort at 300s (UND_ERR_HEADERS_TIMEOUT)
setGlobalDispatcher(new Agent({
    headersTimeout: 900000, // 15 minutes
    bodyTimeout: 900000,    // 15 minutes
    connectTimeout: 60000
}));

// Per-request timeout: raise this if your GPU is slow but Ollama IS responding.
// Default 600 s (10 minutes)
const REQUEST_TIMEOUT_MS = parseInt(
    process.env.OLLAMA_REQUEST_TIMEOUT_MS || process.env.REQUEST_TIMEOUT || "600000",
    10
);

class OllamaService {
    constructor() {
        this.model = process.env.MODEL_NAME || process.env.OLLAMA_MODEL || "qwen2.5:7b";
        this.baseUrl = process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        this.gpuEnabled = process.env.GPU_ENABLED !== "false";
        this.cpuFallback = process.env.CPU_FALLBACK !== "false";

        this.defaultOptions = {
            temperature: parseFloat(process.env.TEMPERATURE || "0"),
            num_ctx: parseInt(process.env.MAX_CONTEXT || "8192", 10),
            format: "json",
        };
        if (!this.gpuEnabled) {
            this.defaultOptions.num_gpu = 0;
        }
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
        const currentOptions = {
            ...this.defaultOptions,
            ...options,
        };

        const executeInference = async (opts) => {
            const start = Date.now();

            // Explicit per-request timeout via AbortController.
            const controller = new AbortController();
            const timer = setTimeout(() => {
                controller.abort();
            }, REQUEST_TIMEOUT_MS);

            let response;
            try {
                response = await ollama.chat({
                    model: this.model,
                    format: currentOptions.format,
                    options: opts,
                    messages: [{ role: "user", content: prompt }],
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timer);
            }

            const duration = Date.now() - start;
            console.log(`[Ollama] Inference completed in ${duration}ms using ${opts.num_gpu === 0 ? 'CPU' : 'GPU (default)'}`);

            if (!response || !response.message || typeof response.message.content !== "string") {
                throw new Error("Invalid response received from Ollama.");
            }
            return response.message.content.trim();
        };

        try {
            return await executeInference(currentOptions);
        } catch (error) {
            const errorMsg = error.message ? error.message.toLowerCase() : "";
            
            // Check for CUDA / Out of Memory errors
            if (this.cpuFallback && (errorMsg.includes("cuda") || errorMsg.includes("out of memory") || errorMsg.includes("tensor"))) {
                console.warn(`⚠️ [Ollama] GPU Inference Failed: ${error.message}`);
                console.warn("⚠️ [Ollama] Automatically falling back to CPU (num_gpu: 0)...");
                
                try {
                    const cpuOptions = { ...currentOptions, num_gpu: 0 };
                    return await executeInference(cpuOptions);
                } catch (cpuError) {
                    console.error("❌ [Ollama] CPU Fallback Inference Failed:", cpuError.message);
                    throw cpuError;
                }
            }

            console.error("======================================");
            console.error("❌ Ollama Service Error");
            console.error("Model:", this.model);
            console.error("Message:", error.message);
            // Log root cause (e.g. ECONNRESET, AbortError) for diagnosis
            if (error.cause) {
                console.error("Cause:", error.cause.code || error.cause.message || String(error.cause));
            }
            if (error.name === 'AbortError' || (error.message && error.message.includes('abort'))) {
                console.error(`Timeout: request exceeded ${REQUEST_TIMEOUT_MS}ms (OLLAMA_REQUEST_TIMEOUT_MS)`);
            }
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

    /**
     * Generic Q&A, streamed token by token.
     * @param {string} prompt
     * @param {(text: string) => void} onToken - called for each generated piece of text
     * @param {{ signal?: AbortSignal }} [opts] - abort to stop generation (e.g. client disconnected)
     * @returns {Promise<string>} the full answer
     */
    async askStream(prompt, onToken, { signal } = {}) {
        await this.checkModelAvailability();
        const { format, ...options } = this.defaultOptions; // free-text answer, not JSON
        const stream = await ollama.chat({
            model: this.model,
            options,
            messages: [{ role: "user", content: prompt }],
            stream: true,
        });

        const onAbort = () => stream.abort();
        if (signal) {
            if (signal.aborted) onAbort();
            else signal.addEventListener("abort", onAbort, { once: true });
        }

        let full = "";
        try {
            for await (const part of stream) {
                const piece = part && part.message ? part.message.content : "";
                if (piece) {
                    full += piece;
                    onToken(piece);
                }
            }
        } catch (error) {
            if (signal && signal.aborted) return full.trim(); // stopped on purpose
            throw error;
        } finally {
            if (signal) signal.removeEventListener("abort", onAbort);
        }
        return full.trim();
    }
}

module.exports = new OllamaService();