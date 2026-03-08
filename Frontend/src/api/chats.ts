import { client } from './client';
import type {
  ChatDetails,
  ChatFile,
  ChatListParams,
  ChatListResponse,
  ChatSummary,
  RedactResponse,
} from '../types/chat';

export const chatsApi = {
  listChats: async (params: ChatListParams = {}): Promise<ChatListResponse> => {
    const res = await client.get('/chats', { params });
    return res.data;
  },
  getChat: async (chatId: number): Promise<ChatDetails> => {
    const res = await client.get(`/chats/${chatId}`);
    return res.data;
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
  uploadFile: async (file: File, confidenceThreshold: number = 0.5): Promise<RedactResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('confidence_threshold', confidenceThreshold.toString());
    formData.append('return_image', 'true');
    const res = await client.post('/redact', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  listChatFiles: async (chatId: number): Promise<ChatFile[]> => {
    const res = await client.get(`/chats/${chatId}/files`);
    return res.data;
  },
  uploadChatFile: async (chatId: number, file: File): Promise<ChatFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post(`/chats/${chatId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getChatFileDownloadUrl: async (chatId: number, fileId: number): Promise<string> => {
    const res = await client.get(`/chats/${chatId}/files/${fileId}/download`);
    return res.data.url;
  },
  deleteChatFile: async (chatId: number, fileId: number): Promise<void> => {
    await client.delete(`/chats/${chatId}/files/${fileId}`);
  },
};
