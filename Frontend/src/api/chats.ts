import { client } from './client';
import { ChatDetails, ChatSummary, RedactResponse } from '../types/chat';

export const chatsApi = {
  listChats: async (): Promise<ChatSummary[]> => {
    const res = await client.get('/chats');
    return res.data;
  },
  getChat: async (chatId: number): Promise<ChatDetails> => {
    const res = await client.get('/chats');
    const chats = res.data as ChatDetails[];
    const chat = chats.find(c => c.id === chatId);
    if (!chat) throw new Error('Chat not found');
    return chat;
  },
  getMessages: async (chatId: number) => {
    const res = await client.get(`/chats/${chatId}/messages`);
    return res.data;
  },
  createChat: async (payload?: { title?: string }): Promise<ChatSummary> => {
    const res = await client.post('/chats', payload || {});
    return res.data;
  },
  updateChat: async (chatId: number, payload: { title: string }): Promise<ChatSummary> => {
    const res = await client.patch(`/chats/${chatId}`, payload);
    return res.data;
  },
  deleteChat: async (chatId: number): Promise<void> => {
    await client.delete(`/chats/${chatId}`);
  },
  sendMessage: async (chatId: number, payload: { sender: string; content: string; image_url?: string }) => {
    const res = await client.post(`/chats/${chatId}/messages`, payload);
    return res.data;
  },
  uploadFile: async (file: File, types?: string): Promise<RedactResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (types) formData.append('types', types);
    const res = await client.post('/redact', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
};
