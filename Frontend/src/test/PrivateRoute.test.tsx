import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from '../components/PrivateRoute';

const Protected = () => <div>Protected content</div>;
const Login = () => <div>Login page</div>;
const Forbidden = () => <div>Forbidden page</div>;

describe('PrivateRoute RBAC', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to login when token is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Protected />
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('renders page when role is allowed', async () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user_role', 'admin');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Protected />
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to forbidden when role is not allowed', async () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user_role', 'user');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Protected />
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Forbidden page')).toBeInTheDocument();
  });
});
