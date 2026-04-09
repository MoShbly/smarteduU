import { apiClient } from '@/lib/api';

export const assignmentService = {
  async getAssignments(token, courseId) {
    const response = await apiClient.get(courseId ? `/assignments?courseId=${courseId}` : '/assignments', { token });
    return response.data.assignments;
  },
  async getAssignmentsByCourse(courseId, token) {
    const response = await apiClient.get(`/assignments/course/${courseId}`, { token });
    return response.data.assignments;
  },
  async createAssignment(payload, token) {
    const response = await apiClient.post('/assignments', payload, { token });
    return response.data.assignment;
  }
};
