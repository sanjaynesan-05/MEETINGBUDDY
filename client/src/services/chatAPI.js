import api from './apiClient';

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
