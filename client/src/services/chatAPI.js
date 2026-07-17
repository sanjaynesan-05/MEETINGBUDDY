import apiClient from './apiClient';

export const chatAPI = {
  /** Stub for future RAG chat endpoints */
  sendMessage: (data) => apiClient.post('/chat/message', data),
};
