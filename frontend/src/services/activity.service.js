import { apiClient } from '@/lib/api';

export const activityService = {
  async getActivity(token, take = 12) {
    const response = await apiClient.get(`/activity?take=${take}`, { token });
    return response.data.activities;
  }
};
