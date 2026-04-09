import { apiClient } from '@/lib/api';

export const authService = {
  me: (token) => apiClient.get('/auth/me', { token }),
  login: (payload) => apiClient.post('/auth/login', payload),
  register: (payload) => apiClient.post('/auth/register', payload)
};
