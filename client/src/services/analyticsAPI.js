import apiClient from './apiClient';

export const analyticsAPI = {
  /** Stub for future analytics endpoints */
  getGeneralAnalytics: () => apiClient.get('/analytics/general'),
};
