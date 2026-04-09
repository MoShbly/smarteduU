import { apiClient } from '@/lib/api';

export const dashboardService = {
  async getTeacherOverview(token) {
    const response = await apiClient.get('/dashboard/teacher', { token });
    return response.data;
  },

  async getAnalytics(token) {
    const response = await apiClient.get('/dashboard/analytics', { token });
    return response.data;
  },

  async getStudentOverview(token) {
    const response = await apiClient.get('/dashboard/student', { token });
    return response.data;
  }
};
