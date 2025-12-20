import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { chatsApi } from '../api/chats';
import { authApi } from '../api/auth';
import type { ChatSummary } from '../types/chat';
import { Button } from '../components/ui/Button';

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const ChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    chatsApi.listChats().then(data => {
      if (mounted) setChats(data);
    }).catch(() => { });
    return () => { mounted = false };
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const newChat = await chatsApi.createChat();
      setChats(prev => [newChat, ...prev]);
      navigate(`/chats/${newChat.id}`);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
    } finally {
      localStorage.removeItem('access_token');
      navigate('/login');
    }
  };

  const handleStartEdit = (chat: ChatSummary, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title || '');
  };

  const handleSaveEdit = async (chatId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editTitle.trim()) return;
    try {
      const updated = await chatsApi.updateChat(chatId, { title: editTitle.trim() });
      setChats(prev => prev.map(c => c.id === chatId ? updated : c));
      setEditingId(null);
    } catch (e) { }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleDeleteClick = (chatId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(chatId);
  };

  const handleConfirmDelete = async (chatId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await chatsApi.deleteChat(chatId);
      setChats(prev => prev.filter(c => c.id !== chatId));
      setDeleteConfirmId(null);
    } catch (e) { }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ваши чаты</h1>
            <p className="text-gray-500 mt-1">Загружайте изображения для обработки и скрытия данных</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCreate} isLoading={loading} variant="gradient" size="md">
              <PlusIcon />
              Новый чат
            </Button>
            <Link
              to="/profile"
              className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-gray-200 transition-colors"
              title="Профиль"
            >
              <UserIcon />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 transition-colors"
              title="Выйти из аккаунта"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        {chats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatIcon />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Чатов пока нет</h3>
            <p className="text-gray-500 mb-6">Создайте первый чат для обработки изображений</p>
            <Button onClick={handleCreate} isLoading={loading} variant="gradient">
              <PlusIcon />
              Создать первый чат
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map(c => (
              <div
                key={c.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                {deleteConfirmId === c.id ? (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-red-600 font-medium">Удалить этот чат?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleConfirmDelete(c.id, e)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                      >
                        Удалить
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link to={`/chats/${c.id}`} className="block p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ChatIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingId === c.id ? (
                          <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
                            <input
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(c.id, e as any);
                                if (e.key === 'Escape') handleCancelEdit(e as any);
                              }}
                              autoFocus
                              className="flex-1 px-2 py-1 border-2 border-indigo-500 rounded-lg text-sm focus:outline-none"
                            />
                            <button
                              onClick={(e) => handleSaveEdit(c.id, e)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <CheckIcon />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                              <XIcon />
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                            <p className="text-sm text-gray-500">
                              Создан {new Date(c.created_at || '').toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </>
                        )}
                      </div>
                      {editingId !== c.id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleStartEdit(c, e)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Переименовать чат"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(c.id, e)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить чат"
                          >
                            <TrashIcon />
                          </button>
                          <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
