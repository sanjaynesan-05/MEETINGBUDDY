const ragRetrieval = require('./ragRetrieval.service');

const MAX_HISTORY_MESSAGES = 10;
const MAX_QUESTION_LENGTH = 1000;

class RagChatService {
  async chat({ question, meetingId, userId, conversationHistory }) {
    const startTime = Date.now();

    const cleanQuestion = (question || '').trim().slice(0, MAX_QUESTION_LENGTH);
    if (!cleanQuestion) {
      return this._noContextResponse('Please provide a question.', startTime);
    }

    const history = this._boundHistory(conversationHistory);

    const { chunks } = await ragRetrieval.retrieveForChat({
      question: cleanQuestion,
      meetingId,
      userId,
    });

    if (!chunks || chunks.length === 0) {
      return this._noContextResponse(
        "I couldn't find that information in the meeting transcripts. The question may be outside the scope of the available meeting data.",
        startTime
      );
    }

    const prompt = this._buildPrompt(cleanQuestion, chunks, history);
    const ollamaResponse = await this._callOllama(prompt);

    const { answer, citedLabels } = this._parseResponse(ollamaResponse);

    const citations = citedLabels
      .map((label) => chunks.find((c) => c.sourceLabel === label))
      .filter(Boolean)
      .map((c) => ({
        meetingId: c.meetingId,
        snippet: c.snippet.slice(0, 300),
        sourceLabel: c.sourceLabel,
      }));

    const finalAnswer = this._injectFallbackCitations(answer, citations, chunks);

    return {
      success: true,
      answer: finalAnswer,
      citations,
      metadata: {
        responseTime: Date.now() - startTime,
        chunksUsed: chunks.length,
        model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      },
    };
  }

  _boundHistory(history) {
    if (!Array.isArray(history) || history.length === 0) return [];
    return history.slice(-MAX_HISTORY_MESSAGES);
  }

  _buildPrompt(question, chunks, history) {
    let prompt = 'You are an AI Meeting Assistant. Answer ONLY using the provided meeting excerpts.\n';
    prompt += 'NEVER invent information. If the answer is not in the excerpts, say "I couldn\'t find that information in the meeting transcripts."\n';
    prompt += 'When you use information from a specific source, cite it inline like [S1], [S2], etc.\n';
    prompt += 'Each source is labeled with its label at the start.\n\n';

    if (history.length > 0) {
      prompt += 'CONVERSATION HISTORY:\n';
      for (const msg of history) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        prompt += `${role}: ${(msg.content || '').slice(0, 500)}\n`;
      }
      prompt += '\n';
    }

    prompt += 'MEETING EXCERPTS:\n';
    for (const chunk of chunks) {
      prompt += `${chunk.sourceLabel} (Meeting: ${chunk.meetingTitle || chunk.meetingId})\n`;
      prompt += `${chunk.snippet}\n\n`;
    }

    prompt += `QUESTION: ${question}\n\n`;
    prompt += 'ANSWER (cite sources inline with [S1], [S2], etc.):';

    return prompt;
  }

  async _callOllama(prompt) {
    const ollamaService = require('./ollama.service');
    try {
      return await ollamaService.ask(prompt);
    } catch (err) {
      console.error('[RagChatService] Ollama service error, attempting raw fetch fallback:', err.message);
      const ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_HOST || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';
    }
  }

  _parseResponse(raw) {
    const answer = (raw || '').trim();
    const labelRegex = /\[S(\d+)\]/g;
    const labels = new Set();
    let match;
    while ((match = labelRegex.exec(answer)) !== null) {
      labels.add(`[S${match[1]}]`);
    }
    return { answer, citedLabels: Array.from(labels) };
  }

  _injectFallbackCitations(answer, citations, chunks) {
    if (citations.length > 0) return answer;
    if (chunks.length === 0) return answer;

    const top = chunks[0];
    return answer + `\n\n---\n_Source: [${top.sourceLabel}] ${top.meetingId}_`;
  }

  _noContextResponse(message, startTime) {
    return {
      success: true,
      answer: message,
      citations: [],
      metadata: {
        responseTime: Date.now() - startTime,
        chunksUsed: 0,
        model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      },
    };
  }
}

module.exports = new RagChatService();
