import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // Proxied via Vite
});

export const sendChatMessage = async (question, filters = {}) => {
  try {
    const response = await api.post('/ai/chat', {
      question,
      filters
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to communicate with AI Gateway');
  }
};
