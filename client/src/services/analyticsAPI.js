import apiClient from './apiClient';

export const analyticsAPI = {
  /**
   * Get all analytics data in a unified dashboard payload
   * @param {Object} filters - Optional { from, to } date strings
   */
  getDashboardData: (filters = {}) => {
    return apiClient.get('/analytics/dashboard', { params: filters });
  }
};
