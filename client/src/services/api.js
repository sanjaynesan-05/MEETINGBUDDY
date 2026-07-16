import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ── Meeting API ──
export const meetingAPI = {
  /**
   * Upload a meeting recording with progress tracking
   * @param {FormData} formData - Must contain 'file', 'title', optional 'description'
   * @param {function} onProgress - Callback with progress percentage (0-100)
   */
  upload: (formData, onProgress) =>
    api.post('/meetings/upload', formData, {
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
  getAll: () => api.get('/meetings'),

  /** Get a single meeting by ID */
  getById: (id) => api.get(`/meetings/${id}`),

  /** Get transcript data for a meeting */
  getTranscript: (id) => api.get(`/meetings/${id}/transcript`),

  /** Delete a meeting */
  delete: (id) => api.delete(`/meetings/${id}`),
};

export default api;
