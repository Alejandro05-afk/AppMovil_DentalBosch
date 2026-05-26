import { apiClient } from '@/shared/api/apiClient';

export const userService = {
  updatePushToken: async (pushToken: string): Promise<{ success: boolean }> => {
    const response = await apiClient.patch<{ success: boolean }>('/auth/push-token', {
      pushToken,
    });
    return response.data;
  },
};
