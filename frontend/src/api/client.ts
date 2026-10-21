import axios from 'axios';
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../services/secureStorage';
import Constants from 'expo-constants';

export const AUTH_TOKEN_KEY = '@zapp_auth_token';
export const REFRESH_TOKEN_KEY = '@zapp_refresh_token';
export const USER_KEY = '@zapp_auth_user';

export const CURRENT_LAN_IP = '192.168.1.14';
export const DEFAULT_API_BASE = `http://${CURRENT_LAN_IP}:5000/api/v1`;

// Intelligent dynamic base URL:
// 1. Web browser: Always use current host or localhost:5000
// 2. Physical device on same Wi-Fi: Auto-detects dev PC IP from Metro bundler URL or Expo hostUri
// 3. Environment variable EXPO_PUBLIC_API_URL if set and NOT containing stale .22
// 4. Default fallback: 192.168.1.14:5000 (Current PC LAN IP)
export const getDefaultBaseUrl = (): string => {
  // If env var is set, use it ONLY if it is not pointing to the stale 192.168.1.22 IP
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('192.168.1.22')) {
    return envUrl;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168.1.22')) {
        return `http://${hostname}:5000/api/v1`;
      }
    }
    return 'http://localhost:5000/api/v1';
  }

  // 1. Detect from NativeModules scriptURL (Metro bundler connection)
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1' && !match[1].includes('192.168.1.22')) {
        return `http://${match[1]}:5000/api/v1`;
      }
    }
  } catch {
    // Continue to next detection method
  }

  // 2. Detect host IP from Expo packager (debuggerHost / linkingUri / hostUri)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    Constants.linkingUri;

  if (hostUri) {
    const cleanUri = hostUri.replace(/^[a-z]+:\/\//i, '');
    const host = cleanUri.split(':')[0]?.split('/')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('192.168.1.22')) {
      return `http://${host}:5000/api/v1`;
    }
  }

  return DEFAULT_API_BASE;
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

// Automatically attach Bearer token from secure storage
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
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

// Response interceptor with automatic fallback recovery on connection errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Automatic network fallback: if server was unreachable (e.g. stale IP like 192.168.1.22)
    // and this request hasn't been retried yet, switch to the verified active LAN IP and retry.
    if (!error.response && originalRequest && !originalRequest._retriedWithLiveIp) {
      originalRequest._retriedWithLiveIp = true;
      const targetBase = DEFAULT_API_BASE;
      if (apiClient.defaults.baseURL !== targetBase || originalRequest.baseURL !== targetBase) {
        console.log(`🔄 [API Client] Server unreachable at ${originalRequest.baseURL || apiClient.defaults.baseURL}. Auto-retrying with active IP: ${targetBase}`);
        apiClient.defaults.baseURL = targetBase;
        originalRequest.baseURL = targetBase;
        try {
          return await axios.request(originalRequest);
        } catch (retryErr: any) {
          error = retryErr;
        }
      }
    }

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
        await secureStorage.removeItem(AUTH_TOKEN_KEY);
        await secureStorage.removeItem(REFRESH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
      } catch {
        // Ignore removal error
      }
    }

    return Promise.reject(new Error(errorMsg));
  }
);
