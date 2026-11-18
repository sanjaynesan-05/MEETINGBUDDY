/**
 * Shared prompt construction for the meeting extractors.
 *
 * Layout: transcript FIRST, instructions LAST.
 *  - If a prompt ever exceeds num_ctx, Ollama drops tokens from the front.
 *    With instructions last, they survive; previously they were cut off and
 *    the model replied with free-form text (e.g. {"result": "..."} in Chinese).
 *  - All 9 extractors send an identical transcript prefix, so Ollama can reuse
 *    the cached KV for it instead of re-evaluating the whole transcript 9 times.
 */

const LANGUAGE_RULE =
    "Write every value in the JSON in English, even if the transcript is in another " +
    "language (such as Tamil or Hindi) or mixes languages. Use exactly the JSON keys shown above.";

function buildExtractionPrompt(template, transcript) {
    const idx = template.lastIndexOf("Transcript:");
    const instructions = (idx === -1 ? template.replace("{{TRANSCRIPT}}", "") : template.slice(0, idx)).trim();
    return `Transcript:\n${transcript}\n\n---\n${instructions}\n\n${LANGUAGE_RULE}`;
}

/**
 * Rough token estimate for Qwen-style BPE tokenizers. Latin text is ~4 chars
 * per token, but Indic scripts are far denser (measured: Tamil ≈ 1.22 tokens
 * per character), so a character limit sized for English overflows the context.
 */
function estimateTokens(text) {
    let ascii = 0;
    let other = 0;
    for (const ch of text) {
        if (ch.charCodeAt(0) < 128) ascii++;
        else other++;
    }
    return Math.ceil(ascii / 3.5 + other * 1.3);
}

/**
 * Trim the transcript so prompt + instructions + answer fit in numCtx tokens.
 * Returns { text, truncated, estimatedTokens }.
 */
function fitTranscriptToContext(transcript, numCtx, reserveTokens = 1500) {
    const budget = Math.max(1000, numCtx - reserveTokens);
    const estimatedTokens = estimateTokens(transcript);
    if (estimatedTokens <= budget) {
        return { text: transcript, truncated: false, estimatedTokens };
    }
    // Binary search the longest prefix (by code point) that fits the budget.
    const chars = [...transcript];
    let lo = 0;
    let hi = chars.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (estimateTokens(chars.slice(0, mid).join("")) <= budget) lo = mid;
        else hi = mid - 1;
    }
    return {
        text: chars.slice(0, lo).join("") + "\n...[TRUNCATED]",
        truncated: true,
        estimatedTokens,
    };
}

/** True when most letters are non-Latin (Tamil, Hindi, ...). */
function isMostlyNonLatin(text) {
    const letters = (text || "").replace(/[\s\d\p{P}\p{S}]/gu, "");
    if (!letters.length) return false;
    const latin = (letters.match(/[A-Za-z]/g) || []).length;
    return latin / letters.length < 0.5;
}

module.exports = { buildExtractionPrompt, estimateTokens, fitTranscriptToContext, isMostlyNonLatin };
