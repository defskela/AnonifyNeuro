import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatsApi } from '../api/chats';
import { client } from '../api/client';

vi.mock('../api/client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('chatsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listChats', () => {
    it('fetches chats list', async () => {
      const mockData = [{ id: 1, title: 'Chat 1' }];
      vi.mocked(client.get).mockResolvedValue({ data: mockData });

      const result = await chatsApi.listChats();

      expect(client.get).toHaveBeenCalledWith('/chats');
      expect(result).toEqual(mockData);
    });
  });

  describe('getMessages', () => {
    it('fetches messages for a chat', async () => {
      const mockData = [{ id: 1, content: 'Hello' }];
      vi.mocked(client.get).mockResolvedValue({ data: mockData });

      const result = await chatsApi.getMessages(5);

      expect(client.get).toHaveBeenCalledWith('/chats/5/messages');
      expect(result).toEqual(mockData);
    });
  });

  describe('createChat', () => {
    it('creates a new chat', async () => {
      const mockData = { id: 1, title: 'New Chat' };
      vi.mocked(client.post).mockResolvedValue({ data: mockData });

      const result = await chatsApi.createChat({ title: 'New Chat' });

      expect(client.post).toHaveBeenCalledWith('/chats', { title: 'New Chat' });
      expect(result).toEqual(mockData);
    });
  });

  describe('sendMessage', () => {
    it('sends a message', async () => {
      const mockData = { id: 1, sender: 'user', content: 'Test' };
      vi.mocked(client.post).mockResolvedValue({ data: mockData });

      const result = await chatsApi.sendMessage(3, { sender: 'user', content: 'Test' });

      expect(client.post).toHaveBeenCalledWith('/chats/3/messages', { sender: 'user', content: 'Test' });
      expect(result).toEqual(mockData);
    });

    it('sends a message with image', async () => {
      const mockData = { id: 1, sender: 'user', content: 'Test', image_url: 'http://example.com/img.jpg' };
      vi.mocked(client.post).mockResolvedValue({ data: mockData });

      const result = await chatsApi.sendMessage(3, { sender: 'user', content: 'Test', image_url: 'http://example.com/img.jpg' });

      expect(client.post).toHaveBeenCalledWith('/chats/3/messages', { sender: 'user', content: 'Test', image_url: 'http://example.com/img.jpg' });
      expect(result).toEqual(mockData);
    });
  });
});
