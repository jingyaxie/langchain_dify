import { apiClient } from './apiClient';
import { User, AuthResponse, ApiResponse } from '../types';

export const authApi = {
  // 用户登录
  login: async (credentials: { username: string; password: string }) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials);
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data.data;
  },

  // 用户注册
  register: async (userData: { username: string; email: string; password: string }) => {
    const response = await apiClient.post<ApiResponse<User>>('/api/auth/register', userData);
    return response.data.data;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await apiClient.get<ApiResponse<User>>('/api/auth/me');
    return response.data.data;
  },

  // 更新用户信息
  updateUser: async (updates: Partial<User>) => {
    const response = await apiClient.put<ApiResponse<User>>('/api/auth/me', updates);
    const user = response.data.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  // 退出登录
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // 检查是否已登录
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // 获取当前用户
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
}; 