import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AdminPage } from '../pages/AdminPage';
import { authApi } from '../api/auth';

vi.mock('../api/auth', () => ({
  authApi: {
    listUsers: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders users table from API', async () => {
    vi.mocked(authApi.listUsers).mockResolvedValue([
      { id: 1, username: 'alice', email: 'alice@example.com', role: 'user' },
      { id: 2, username: 'admin', email: 'admin@example.com', role: 'admin' },
    ]);

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('updates role for a user', async () => {
    vi.mocked(authApi.listUsers).mockResolvedValue([
      { id: 1, username: 'alice', email: 'alice@example.com', role: 'user' },
    ]);
    vi.mocked(authApi.updateUserRole).mockResolvedValue({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: 'admin',
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    );

    await screen.findByText('alice');

    const select = screen.getByDisplayValue('user');
    fireEvent.change(select, { target: { value: 'admin' } });

    const saveButton = screen.getByRole('button', { name: 'Сохранить' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(authApi.updateUserRole).toHaveBeenCalledWith(1, 'admin');
    });

    expect(await screen.findByText(/Роль пользователя alice обновлена на admin/i)).toBeInTheDocument();
  });
});
