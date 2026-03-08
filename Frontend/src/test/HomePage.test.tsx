import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { externalApi } from '../api/external';

vi.mock('../api/auth', () => ({
  authApi: {
    logout: vi.fn(),
  },
}));

vi.mock('../auth/session', () => ({
  session: {
    getRole: vi.fn(() => 'user'),
    getRefreshToken: vi.fn(() => null),
    clear: vi.fn(),
  },
}));

vi.mock('../api/external', () => ({
  externalApi: {
    getWeather: vi.fn(),
  },
}));

describe('HomePage external weather widget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders weather data from external API', async () => {
    vi.mocked(externalApi.getWeather).mockResolvedValue({
      city: 'Moscow',
      country: 'RU',
      temperature_c: 5,
      feels_like_c: 1,
      description: 'пасмурно',
      humidity: 70,
      wind_speed: 3,
      source: 'openweathermap',
      fetched_at: '2026-03-08T10:00:00+00:00',
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Moscow, RU')).toBeInTheDocument();
      expect(screen.getByText('пасмурно')).toBeInTheDocument();
    });
  });

  it('shows graceful degradation message on provider outage', async () => {
    vi.mocked(externalApi.getWeather).mockRejectedValue({ response: { status: 503 } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Сервис погоды временно недоступен/i)).toBeInTheDocument();
    });
  });
});
