import api from './apiClient';

export const searchAPI = {
  /**
   * Search across meetings
   * @param {Object} params - { q, page, limit, from, to, meetingType }
   * @param {AbortSignal} signal - For canceling stale requests
   */
  searchMeetings: async (params, signal) => {
    // Clean up empty params
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && v !== '')
    );
    
    const response = await api.get('/search', { 
      params: cleanParams,
      signal 
    });
    return response.data;
  }
};
