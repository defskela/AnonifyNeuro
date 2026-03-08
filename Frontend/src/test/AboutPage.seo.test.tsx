import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AboutPage } from '../pages/AboutPage';

describe('AboutPage SEO', () => {
  it('sets title and canonical link', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <AboutPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.title).toContain('AnonifyNeuro');
      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical).toBeTruthy();
      expect(canonical?.getAttribute('href')).toContain('/about');
    });
  });
});
