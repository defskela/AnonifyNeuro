import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ChatPage } from '../pages/ChatPage';
import { chatsApi } from '../api/chats';

vi.mock('../api/chats', () => ({
  chatsApi: {
    listChats: vi.fn(),
    createChat: vi.fn(),
    getChat: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chatsApi.getChat).mockResolvedValue({ id: 1, title: 'Test Chat', created_at: '2025-01-01T00:00:00Z' });
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

    const input = screen.getByPlaceholderText(/Введите сообщение/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find(b => b.classList.contains('from-indigo-600'));
    fireEvent.click(sendButton!);

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

    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find(b => b.classList.contains('bg-gradient-to-r'));
    fireEvent.click(sendButton!);

    expect(chatsApi.sendMessage).not.toHaveBeenCalled();
  });
});
