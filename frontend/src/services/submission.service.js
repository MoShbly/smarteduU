import { apiClient } from '@/lib/api';

export const submissionService = {
  async getSubmissions(token, assignmentId) {
    const response = await apiClient.get(assignmentId ? `/submissions?assignmentId=${assignmentId}` : '/submissions', {
      token
    });
    return response.data.submissions;
  },
  async getAssignmentSubmissions(assignmentId, token) {
    const response = await apiClient.get(`/submissions/assignment/${assignmentId}`, { token });
    return response.data;
  },
  async createSubmission(payload, token) {
    const response = await apiClient.post('/submissions', payload, { token });
    return response.data.submission;
  },
  async reviewSubmission(submissionId, payload, token) {
    const response = await apiClient.patch(`/submissions/${submissionId}/review`, payload, { token });
    return response.data.submission;
  }
};
