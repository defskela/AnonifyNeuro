import { describe, it, expect, beforeEach } from 'vitest';
import { session } from '../auth/session';

describe('session utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and reads access/refresh tokens', () => {
    session.setTokens('access-a', 'refresh-b');

    expect(session.getToken()).toBe('access-a');
    expect(session.getRefreshToken()).toBe('refresh-b');
  });

  it('stores and reads role', () => {
    session.setRole('admin');
    expect(session.getRole()).toBe('admin');
  });

  it('clears full auth state', () => {
    session.setTokens('access-a', 'refresh-b');
    session.setRole('user');

    session.clear();

    expect(session.getToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
    expect(session.getRole()).toBeNull();
  });
});
