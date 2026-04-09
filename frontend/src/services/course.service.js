import { apiClient } from '@/lib/api';

export const courseService = {
  async getCourses(token) {
    const response = await apiClient.get('/courses', { token });
    return response.data.courses;
  },
  async createCourse(payload, token) {
    const response = await apiClient.post('/courses', payload, { token });
    return response.data.course;
  },
  async joinCourse(payload, token) {
    const response = await apiClient.post('/courses/join', payload, { token });
    return response.data.course;
  }
};
