import { request } from './apiClient';
import { User } from '../types';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.accessToken) {
      localStorage.setItem('dgx_access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('dgx_refresh_token', data.refreshToken);
    }
    return data;
  },

  register: async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
    if (data.accessToken) {
      localStorage.setItem('dgx_access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('dgx_refresh_token', data.refreshToken);
    }
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('dgx_refresh_token');
    try {
      if (refreshToken) {
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('dgx_access_token');
      localStorage.removeItem('dgx_refresh_token');
    }
  },
};
