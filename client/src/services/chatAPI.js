import api, { API_BASE_URL } from './apiClient';

/**
 * Stream an answer from POST /chat/stream (Server-Sent Events over fetch).
 * Calls onEvent for each event: context | token | done | error.
 * Resolves when the stream ends. Pass an AbortSignal to cancel.
 */
export async function streamChatMessage(question, filters = {}, onEvent, signal) {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({
      question,
      meetingId: filters.meetingId || undefined,
      conversationHistory: filters.conversationHistory || undefined,
    }),
    signal,
  });

  if (response.status === 401) {
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  if (!response.ok || !response.body) {
    const err = new Error(response.status === 429 ? 'Too many chat requests, please slow down.' : `Chat request failed (${response.status}).`);
    err.status = response.status;
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const data = raw.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n');
      if (data) onEvent(JSON.parse(data));
    }
  }
}

export const chatAPI = {
  sendMessage: async ({ question, meetingId, conversationHistory }) => {
    const payload = { question };
    if (meetingId) payload.meetingId = meetingId;
    if (conversationHistory) payload.conversationHistory = conversationHistory;

    const response = await api.post('/chat', payload);
    return response.data;
  },
};

export const sendChatMessage = async (question, filters = {}) => {
  const response = await api.post('/chat', {
    question,
    meetingId: filters.meetingId || undefined,
    conversationHistory: filters.conversationHistory || undefined,
  });
  return response.data;
};
