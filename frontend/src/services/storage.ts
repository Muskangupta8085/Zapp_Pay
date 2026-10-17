/**
 * Storage service abstraction.
 * Easily replace or back with AsyncStorage or react-native-mmkv.
 */
export const StorageService = {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      // Placeholder for AsyncStorage / MMKV implementation
      return null;
    } catch {
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      // Placeholder
    } catch (error) {
      console.error('Storage error', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      // Placeholder
    } catch (error) {
      console.error('Storage error', error);
    }
  },
};
