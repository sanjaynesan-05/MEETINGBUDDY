import api from './api';

export const dashboardAPI = {
  /**
   * Get aggregated dashboard stats
   * Contains stats, recent activity, pending actions, top keywords, etc.
   * @returns {Promise<Object>}
   */
  getDashboardData: () => api.get('/dashboard'),
};
