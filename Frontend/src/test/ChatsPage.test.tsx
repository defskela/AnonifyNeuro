import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChatsPage } from '../pages/ChatsPage';
import { chatsApi } from '../api/chats';

vi.mock('../api/chats', () => ({
  chatsApi: {
    listChats: vi.fn(),
    createChat: vi.fn(),
    updateChat: vi.fn(),
    deleteChat: vi.fn(),
    getChat: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    uploadFile: vi.fn(),
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

  it('creates a new chat with default name', async () => {
    vi.mocked(chatsApi.listChats).mockResolvedValue([]);
    vi.mocked(chatsApi.createChat).mockResolvedValue({
      id: 3,
      title: 'New Chat 1',
      created_at: '2025-01-03T00:00:00Z',
    });

    renderWithRouter(<ChatsPage />);

    const newChatButton = screen.getByText('Новый чат');
    fireEvent.click(newChatButton);

    await waitFor(() => {
      expect(chatsApi.createChat).toHaveBeenCalled();
    });
  });

  it('can rename a chat', async () => {
    const mockChats = [
      { id: 1, title: 'Test Chat', created_at: '2025-01-01T00:00:00Z' },
    ];
    vi.mocked(chatsApi.listChats).mockResolvedValue(mockChats);
    vi.mocked(chatsApi.updateChat).mockResolvedValue({
      id: 1,
      title: 'Renamed Chat',
      created_at: '2025-01-01T00:00:00Z',
    });

    renderWithRouter(<ChatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });

    const renameButton = screen.getByTitle('Переименовать чат');
    fireEvent.click(renameButton);

    const input = screen.getByDisplayValue('Test Chat');
    fireEvent.change(input, { target: { value: 'Renamed Chat' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(chatsApi.updateChat).toHaveBeenCalledWith(1, { title: 'Renamed Chat' });
    });
  });

  it('can delete a chat', async () => {
    const mockChats = [
      { id: 1, title: 'Test Chat', created_at: '2025-01-01T00:00:00Z' },
    ];
    vi.mocked(chatsApi.listChats).mockResolvedValue(mockChats);
    vi.mocked(chatsApi.deleteChat).mockResolvedValue(undefined);

    renderWithRouter(<ChatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Удалить чат');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Удалить этот чат?')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Удалить');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(chatsApi.deleteChat).toHaveBeenCalledWith(1);
    });
  });
});
