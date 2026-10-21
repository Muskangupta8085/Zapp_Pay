import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../services/secureStorage';
import { AuthService, UserProfile, RegisterPayload, LoginPayload } from '../services/auth.service';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../api/client';

import { apiClient } from '../api/client';

export interface WalletBalance {
  symbol: string;
  amount: number;
  lockedAmount: number;
}

export interface UserWallet {
  walletAddress: string;
  balances: WalletBalance[];
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  wallet: UserWallet | null;
  xCoinBalance: number;
  usdtBalance: number;
  token: string | null;
  userAddress: string | null; // For backward compatibility
  loginWithCredentials: (
    identifier: string,
    password: string,
    authMethod?: 'mobile' | 'email'
  ) => Promise<{ contactInfo: string; requiresOtp: boolean; devOtp?: string }>;
  registerWithCredentials: (
    data: RegisterPayload
  ) => Promise<{ contactInfo: string; devOtp?: string }>;
  verifyOtp: (
    contactInfo: string,
    otp: string,
    isRegistered?: boolean
  ) => Promise<UserProfile>;
  resendOtp: (contactInfo: string, purpose?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  updateUser: (updatedData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const xCoinBalance = wallet?.balances?.find((b) => b.symbol === 'ZAP' || b.symbol === 'xCoin')?.amount ?? 100;
  const usdtBalance = wallet?.balances?.find((b) => b.symbol === 'USDT')?.amount ?? 0;

  // Restore session from AsyncStorage on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await secureStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Background sync fresh profile and wallet
          try {
            const profileRes = await AuthService.getProfile();
            if (profileRes.success && profileRes.data) {
              if (profileRes.data.user) {
                const freshUser = profileRes.data.user;
                setUser(freshUser);
                await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
              }
              if (profileRes.data.wallet) {
                setWallet(profileRes.data.wallet);
              }
            }
          } catch {
            // Keep cached user if offline or network hiccup
          }
        }
      } catch (err) {
        console.warn('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginWithCredentials = async (
    identifier: string,
    password: string,
    authMethod?: 'mobile' | 'email'
  ) => {
    const res = await AuthService.login({ identifier, password, authMethod });
    if (!res.success) {
      throw new Error(res.message || 'Login failed');
    }
    return {
      contactInfo: res.data.contactInfo,
      requiresOtp: res.data.requiresOtp,
      devOtp: res.data.devOtp,
    };
  };

  const registerWithCredentials = async (data: RegisterPayload) => {
    const res = await AuthService.register(data);
    if (!res.success) {
      throw new Error(res.message || 'Registration failed');
    }
    return {
      contactInfo: res.data.contactInfo,
      devOtp: res.data.devOtp,
    };
  };

  const refreshWallet = async () => {
    try {
      const res = await apiClient.get('/wallet/overview');
      if (res.data?.success && res.data?.data) {
        setWallet(res.data.data);
      }
    } catch (err) {
      // Offline fallback
    }
  };

  const verifyOtp = async (contactInfo: string, otp: string, isRegistered = false) => {
    const res = await AuthService.verifyOtp({ contactInfo, otp, isRegistered });
    if (!res.success || !res.data?.token) {
      throw new Error(res.message || 'OTP verification failed');
    }

    const { user: verifiedUser, token: authToken, refreshToken } = res.data;

    // Persist to secure hardware storage
    await secureStorage.setItem(AUTH_TOKEN_KEY, authToken);
    if (refreshToken) {
      await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));

    setToken(authToken);
    setUser(verifiedUser);

    // Refresh wallet in background
    setTimeout(() => {
      refreshWallet();
    }, 100);

    return verifiedUser;
  };

  const resendOtp = async (contactInfo: string, purpose?: string) => {
    const res = await AuthService.resendOtp(contactInfo, purpose);
    if (!res.success) {
      throw new Error(res.message || 'Failed to resend code');
    }
    return true;
  };

  const logout = async () => {
    try {
      const storedRefreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
      await AuthService.logout(storedRefreshToken || undefined);
    } catch {
      // Proceed with local logout regardless of network error
    } finally {
      await secureStorage.removeItem(AUTH_TOKEN_KEY);
      await secureStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      setWallet(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const profileRes = await AuthService.getProfile();
      if (profileRes.success && profileRes.data) {
        if (profileRes.data.user) {
          setUser(profileRes.data.user);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(profileRes.data.user));
        }
        if (profileRes.data.wallet) {
          setWallet(profileRes.data.wallet);
        }
      }
    } catch (err) {
      console.warn('Failed to refresh profile:', err);
    }
  };

  const updateUser = (updatedData: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        isLoading,
        user,
        wallet,
        xCoinBalance,
        usdtBalance,
        token,
        userAddress: user?.walletAddress || wallet?.walletAddress || null,
        loginWithCredentials,
        registerWithCredentials,
        verifyOtp,
        resendOtp,
        logout,
        refreshProfile,
        refreshWallet,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
