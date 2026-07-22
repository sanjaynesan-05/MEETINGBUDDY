import api from './apiClient';

export const tasksAPI = {
  getAll: (params = {}) => api.get('/tasks', { params }),
  update: (meetingId, index, data) => api.put(`/tasks/${meetingId}/${index}`, data),
};
