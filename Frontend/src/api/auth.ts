import { client } from './client';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<void> => {
    await client.post('/auth/register', credentials);
  },

  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  },
};
