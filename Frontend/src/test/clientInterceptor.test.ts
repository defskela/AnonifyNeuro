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

type RejectedInterceptor = (error: {
  config?: { url?: string; _retry?: boolean };
  response?: { status?: number };
}) => Promise<unknown>;

const getRejectedHandler = (): RejectedInterceptor => {
  const responseInterceptors = client.interceptors.response as unknown as {
    handlers?: Array<{ rejected?: RejectedInterceptor }>;
  };

  const rejected = responseInterceptors.handlers?.[0]?.rejected;
  if (!rejected) {
    throw new Error('Response rejected interceptor is not registered');
  }

  return rejected;
};

describe('client interceptor session handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/login');
  });

  it('clears session on 401 when refresh token is missing', async () => {
    const rejected = getRejectedHandler();
    const error = {
      config: { url: '/chats', _retry: false },
      response: { status: 401 },
    };

    await expect(rejected(error)).rejects.toEqual(error);
    expect(session.clear).toHaveBeenCalled();
  });

  it('does not trigger refresh flow for auth endpoints', async () => {
    const rejected = getRejectedHandler();
    const error = {
      config: { url: '/auth/login', _retry: false },
      response: { status: 401 },
    };

    await expect(rejected(error)).rejects.toEqual(error);
    expect(session.clear).not.toHaveBeenCalled();
  });
});
