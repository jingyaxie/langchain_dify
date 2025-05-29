import { apiClient } from './apiClient';
import { User, AuthResponse } from '../types';

export const authApi = {
  // 用户登录
  login: async (credentials: { username: string; password: string }) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    const { access_token, user } = response;
    localStorage.setItem('authToken', access_token);
    localStorage.setItem('userData', JSON.stringify(user));
    return response;
  },

  // 用户注册
  register: async (userData: { username: string; email?: string; password: string }) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', userData);
    const { access_token, user } = response;
    localStorage.setItem('authToken', access_token);
    localStorage.setItem('userData', JSON.stringify(user));
    return response;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await apiClient.get<User>('/api/auth/me');
    return response;
  },

  // 更新用户信息
  updateUser: async (updates: Partial<User>) => {
    const response = await apiClient.put<User>('/api/auth/me', updates);
    localStorage.setItem('userData', JSON.stringify(response));
    return response;
  },

  // 退出登录
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  },

  // 检查是否已登录
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  // 获取当前用户
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('userData');
    return userStr ? JSON.parse(userStr) : null;
  },
}; 