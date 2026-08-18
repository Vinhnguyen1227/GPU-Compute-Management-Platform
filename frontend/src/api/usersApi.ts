import { request } from './apiClient';
import { User, Role } from '../types';

export const usersApi = {
  getMe: async (): Promise<User> => {
    return request<User>('/users/me');
  },

  getUsers: async (): Promise<User[]> => {
    return request<User[]>('/users');
  },

  updateUserRole: async (userId: string, role: Role): Promise<User> => {
    return request<User>(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  toggleUserStatus: async (userId: string, status: 'ACTIVE' | 'BANNED'): Promise<User> => {
    return request<User>(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};
