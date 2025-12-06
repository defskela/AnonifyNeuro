import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChatsPage } from '../pages/ChatsPage';
import { chatsApi } from '../api/chats';

vi.mock('../api/chats', () => ({
  chatsApi: {
    listChats: vi.fn(),
    createChat: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ChatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chats list', async () => {
    const mockChats = [
      { id: 1, title: 'Test Chat 1', created_at: '2025-01-01T00:00:00Z' },
      { id: 2, title: 'Test Chat 2', created_at: '2025-01-02T00:00:00Z' },
    ];
    vi.mocked(chatsApi.listChats).mockResolvedValue(mockChats);

    renderWithRouter(<ChatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Chat 1')).toBeInTheDocument();
      expect(screen.getByText('Test Chat 2')).toBeInTheDocument();
    });
  });

  it('creates a new chat', async () => {
    vi.mocked(chatsApi.listChats).mockResolvedValue([]);
    vi.mocked(chatsApi.createChat).mockResolvedValue({
      id: 3,
      title: 'New Chat',
      created_at: '2025-01-03T00:00:00Z',
    });

    renderWithRouter(<ChatsPage />);

    const input = screen.getByPlaceholderText('New chat title');
    const button = screen.getByText('New');

    fireEvent.change(input, { target: { value: 'New Chat' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(chatsApi.createChat).toHaveBeenCalledWith({ title: 'New Chat' });
    });
  });

  it('does not create chat with empty title', async () => {
    vi.mocked(chatsApi.listChats).mockResolvedValue([]);

    renderWithRouter(<ChatsPage />);

    const button = screen.getByText('New');
    fireEvent.click(button);

    expect(chatsApi.createChat).not.toHaveBeenCalled();
  });
});
