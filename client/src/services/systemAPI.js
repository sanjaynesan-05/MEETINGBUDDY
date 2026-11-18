import api from './apiClient';

export const systemAPI = {
  getStatus: () => api.get('/system/status'),
};
