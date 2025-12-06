import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ChatPage } from '../pages/ChatPage';
import { chatsApi } from '../api/chats';

vi.mock('../api/chats', () => ({
  chatsApi: {
    listChats: vi.fn(),
    createChat: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders messages', async () => {
    const mockMessages = [
      { id: 1, chat_id: 1, sender: 'user', content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
      { id: 2, chat_id: 1, sender: 'assistant', content: 'Hi there!', created_at: '2025-01-01T00:01:00Z' },
    ];
    vi.mocked(chatsApi.getMessages).mockResolvedValue(mockMessages);

    render(
      <MemoryRouter initialEntries={['/chats/1']}>
        <Routes>
          <Route path="/chats/:chatId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  it('sends a message', async () => {
    vi.mocked(chatsApi.getMessages).mockResolvedValue([]);
    vi.mocked(chatsApi.sendMessage).mockResolvedValue({
      id: 1,
      chat_id: 1,
      sender: 'user',
      content: 'Test message',
      created_at: '2025-01-01T00:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/chats/1']}>
        <Routes>
          <Route path="/chats/:chatId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Type your message...');
    const button = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(chatsApi.sendMessage).toHaveBeenCalledWith(1, {
        sender: 'user',
        content: 'Test message',
      });
    });
  });

  it('does not send empty message', async () => {
    vi.mocked(chatsApi.getMessages).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/chats/1']}>
        <Routes>
          <Route path="/chats/:chatId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    );

    const button = screen.getByText('Send');
    fireEvent.click(button);

    expect(chatsApi.sendMessage).not.toHaveBeenCalled();
  });
});
