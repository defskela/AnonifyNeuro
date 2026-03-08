import { client } from './client';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
  UserUpdate,
  UserRole,
} from '../types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await client.post('/auth/logout', {
      refresh_token: refreshToken,
    });
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await client.get<User>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: UserUpdate): Promise<AuthResponse> => {
    const response = await client.put<AuthResponse>('/auth/profile', data);
    return response.data;
  },

  listUsers: async (): Promise<User[]> => {
    const response = await client.get<User[]>('/auth/users');
    return response.data;
  },

  updateUserRole: async (userId: number, role: UserRole): Promise<User> => {
    const response = await client.patch<User>(`/auth/users/${userId}/role`, { role });
    return response.data;
  },
};
