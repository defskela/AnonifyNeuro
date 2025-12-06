import { client } from './client';

export const chatsApi = {
  listChats: async () => {
    const res = await client.get('/chats');
    return res.data;
  },
  getMessages: async (chatId: number) => {
    const res = await client.get(`/chats/${chatId}/messages`);
    return res.data;
  },
  createChat: async (payload: { title: string }) => {
    const res = await client.post('/chats', payload);
    return res.data;
  },
  sendMessage: async (chatId: number, payload: { sender: string; content: string; image_url?: string }) => {
    const res = await client.post(`/chats/${chatId}/messages`, payload);
    return res.data;
  },
};
