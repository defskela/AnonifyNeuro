export type UserRole = 'user' | 'admin';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  message?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface UserUpdate {
  username?: string;
  password?: string;
}
