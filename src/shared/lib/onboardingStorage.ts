import AsyncStorage from '@react-native-async-storage/async-storage';

const getKey = (userId: string) => `onboarding_done_${userId}`;

export const onboardingStorage = {
  async isCompleted(userId: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(getKey(userId));
      return value === 'true';
    } catch {
      return false;
    }
  },

  async markCompleted(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(getKey(userId), 'true');
    } catch (e) {
      console.warn('onboardingStorage.markCompleted error:', e);
    }
  },

  async reset(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(getKey(userId));
    } catch {}
  },
};