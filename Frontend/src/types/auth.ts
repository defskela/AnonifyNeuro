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
  jwt_token: string;
  message?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface UserUpdate {
  username?: string;
  password?: string;
}
