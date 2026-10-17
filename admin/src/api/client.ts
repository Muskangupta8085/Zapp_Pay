const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('zapp_admin_token');
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem('zapp_admin_token', token);
  } catch {
    // ignore
  }
};

export const clearAuthToken = (): void => {
  try {
    localStorage.removeItem('zapp_admin_token');
  } catch {
    // ignore
  }
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string; status?: number }> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      cache: 'no-store',
      ...options,
      headers,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: result.message || `Request failed (${response.status})`,
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error connecting to backend API',
    };
  }
}
