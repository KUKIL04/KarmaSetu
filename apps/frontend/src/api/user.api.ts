import { apiClient } from './client';

export const UserAPI = {
  getProfile: async () => {
    const response = await apiClient.get('/user/me');
    return response.data;
  },
  getMyModules: async () => {
    const response = await apiClient.get('/user/modules');
    return response.data;
  }
};