import apiClient from './apiClient';

export const meetingAPI = {
  /**
   * Upload a meeting recording with progress tracking
   * @param {FormData} formData - Must contain 'file', 'title', optional 'description'
   * @param {function} onProgress - Callback with progress percentage (0-100)
   */
  upload: (formData, onProgress) =>
    apiClient.post('/meetings/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10 * 60 * 1000, // 10 minutes for large files
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
    }),

  /** Get all meetings for the authenticated user */
  getAll: () => apiClient.get('/meetings'),

  /** Get a single meeting by ID */
  getById: (id) => apiClient.get(`/meetings/${id}`),

  /** Get transcript data for a meeting */
  getTranscript: (id) => apiClient.get(`/meetings/${id}/transcript`),

  /** Get AI analysis for a meeting */
  getAnalysis: (id) => apiClient.get(`/meetings/${id}/analysis`),

  /** Delete a meeting */
  delete: (id) => apiClient.delete(`/meetings/${id}`),
};
