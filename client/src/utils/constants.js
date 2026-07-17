export const CONSTANTS = {
  APP_NAME: 'AI Meeting Intelligence System',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_FORMATS: ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'video/mp4'],
  ROUTING: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    MEETINGS: '/meetings',
    UPLOAD: '/upload',
    TRANSCRIPT: '/meeting/:id'
  }
};
