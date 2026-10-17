import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const AUTH_TOKEN_KEY = '@zapp_auth_token';
export const REFRESH_TOKEN_KEY = '@zapp_refresh_token';
export const USER_KEY = '@zapp_auth_user';

// Intelligent dynamic base URL:
// 1. Web browser: Always use localhost:5000 to prevent CORS / Private Network Access issues
// 2. Physical device on same Wi-Fi: Auto-detects dev PC IP from Expo packager hostUri
// 3. Environment variable EXPO_PUBLIC_API_URL if set
// 4. Default fallback: 192.168.1.22:5000 (Current PC LAN IP)
export const getDefaultBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/v1';
  }

  // Detect host IP from Expo packager (debuggerHost)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000/api/v1`;
    }
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return 'http://192.168.1.22:5000/api/v1';
};

const resolvedBaseUrl = getDefaultBaseUrl();
console.log('📡 [Zapp Pay API Client] Active Base URL:', resolvedBaseUrl);

export const apiClient = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach Bearer token if present
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage read error
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error formatting with diagnostics
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const fullTarget = error.config?.url
      ? `${error.config.baseURL || ''}${error.config.url}`
      : apiClient.defaults.baseURL;

    let errorMsg =
      error.response?.data?.message ||
      (error.response?.data?.errors ? error.response.data.errors.join(', ') : null) ||
      error.message;

    if (!error.response) {
      errorMsg = `Cannot reach server at:\n${fullTarget}\n\nPlease verify your phone and PC are on the same Wi-Fi.`;
    }

    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      } catch {
        // Ignore removal error
      }
    }

    return Promise.reject(new Error(errorMsg));
  }
);
