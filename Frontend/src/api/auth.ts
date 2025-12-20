import { client } from './client';
import type { LoginCredentials, RegisterCredentials, AuthResponse, User, UserUpdate } from '../types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  },

  getProfile: async (): Promise<User> => {
    const response = await client.get<User>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: UserUpdate): Promise<AuthResponse> => {
    const response = await client.put<AuthResponse>('/auth/profile', data);
    return response.data;
  },
};
