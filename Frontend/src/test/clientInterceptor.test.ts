import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/session', () => ({
  session: {
    getToken: vi.fn(() => null),
    getRefreshToken: vi.fn(() => null),
    setTokens: vi.fn(),
    clear: vi.fn(),
  },
}));

import { client } from '../api/client';
import { session } from '../auth/session';

describe('client interceptor session handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/login');
  });

  it('clears session on 401 when refresh token is missing', async () => {
    const rejected = (client.interceptors.response as any).handlers[0].rejected;
    const error = {
      config: { url: '/chats', _retry: false },
      response: { status: 401 },
    };

    await expect(rejected(error)).rejects.toEqual(error);
    expect(session.clear).toHaveBeenCalled();
  });

  it('does not trigger refresh flow for auth endpoints', async () => {
    const rejected = (client.interceptors.response as any).handlers[0].rejected;
    const error = {
      config: { url: '/auth/login', _retry: false },
      response: { status: 401 },
    };

    await expect(rejected(error)).rejects.toEqual(error);
    expect(session.clear).not.toHaveBeenCalled();
  });
});
