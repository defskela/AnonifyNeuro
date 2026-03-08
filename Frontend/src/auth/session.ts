export type Role = 'user' | 'admin';

const ACCESS_TOKEN_KEY = 'access_token';
const USER_ROLE_KEY = 'user_role';

export const session = {
  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRole(): Role | null {
    const value = localStorage.getItem(USER_ROLE_KEY);
    if (value === 'user' || value === 'admin') {
      return value;
    }
    return null;
  },

  setRole(role: Role): void {
    localStorage.setItem(USER_ROLE_KEY, role);
  },

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
  },
};
