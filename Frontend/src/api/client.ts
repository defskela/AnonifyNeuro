import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { session } from '../auth/session';
import type { AuthResponse } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string> | null = null;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

client.interceptors.request.use((config) => {
  const token = session.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error?.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl: string = originalRequest.url || '';
    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    const refreshToken = session.getRefreshToken();
    if (!refreshToken) {
      session.clear();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshClient
        .post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken })
        .then((response) => {
          const payload = response.data;
          session.setTokens(payload.access_token, payload.refresh_token);
          return payload.access_token;
        })
        .catch((refreshError) => {
          session.clear();
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newAccessToken = await refreshPromise;
    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return client(originalRequest);
  }
);
