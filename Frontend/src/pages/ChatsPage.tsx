import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { chatsApi } from '../api/chats';
import { authApi } from '../api/auth';
import { session } from '../auth/session';
import { getErrorStatus } from '../utils/httpError';
import type { ChatListParams, ChatSummary } from '../types/chat';
import { Button } from '../components/ui/Button';
import { SeoMeta } from '../components/seo/SeoMeta';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const role = session.getRole();

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const queryState = useMemo(() => {
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('page_size') || '10');
    const q = searchParams.get('q') || '';
    const ownerIdRaw = searchParams.get('owner_id') || '';
    const minMessagesRaw = searchParams.get('min_messages') || '';
    const hasImagesRaw = searchParams.get('has_images') || '';
    const sortBy = (searchParams.get('sort_by') || 'created_at') as ChatListParams['sort_by'];
    const sortOrder = (searchParams.get('sort_order') || 'desc') as ChatListParams['sort_order'];

    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
      q,
      ownerIdRaw,
      minMessagesRaw,
      hasImagesRaw,
      sortBy,
      sortOrder,
    };
  }, [searchParams]);

  const updateParams = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  const loadChats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await chatsApi.listChats({
        q: queryState.q || undefined,
        owner_id: role === 'admin' && queryState.ownerIdRaw ? Number(queryState.ownerIdRaw) : undefined,
        min_messages: queryState.minMessagesRaw ? Number(queryState.minMessagesRaw) : undefined,
        has_images: queryState.hasImagesRaw === '' ? undefined : queryState.hasImagesRaw === 'true',
        sort_by: queryState.sortBy,
        sort_order: queryState.sortOrder,
        page: queryState.page,
        page_size: queryState.pageSize,
      });

      setChats(response.items);
      setTotal(response.total);
      setPages(response.pages);
    } catch (err: unknown) {
      if (getErrorStatus(err) === 403) {
        setError('Недостаточно прав для просмотра чатов.');
      } else {
        setError('Не удалось загрузить список чатов.');
      }
    } finally {
      setLoading(false);
    }
  }, [queryState, role]);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const newChat = await chatsApi.createChat();
      navigate(`/chats/${newChat.id}`);
    } catch (e: unknown) {
      if (getErrorStatus(e) === 403) {
        setError('Недостаточно прав для создания чата.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const refreshToken = session.getRefreshToken() || undefined;
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Ignore logout API failure and clear local session regardless.
    } finally {
      session.clear();
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
    } catch (e: unknown) {
      if (getErrorStatus(e) === 403) {
        setError('Недостаточно прав для редактирования чата.');
      }
    }
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
      await loadChats();
      setDeleteConfirmId(null);
    } catch (e: unknown) {
      if (getErrorStatus(e) === 403) {
        setError('Недостаточно прав для удаления чата.');
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <SeoMeta
        title="Чаты - AnonifyNeuro"
        description="Список рабочих чатов пользователя в AnonifyNeuro."
        path="/chats"
        noindex
      />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ваши чаты</h1>
            <p className="text-gray-500 mt-1">Поиск, фильтрация, сортировка и пагинация</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCreate} isLoading={loading} variant="gradient" size="md">
              <PlusIcon />
              Новый чат
            </Button>
            <Link to="/profile" className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-gray-200 transition-colors" title="Профиль">
              <UserIcon />
            </Link>
            <button onClick={handleLogout} className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 transition-colors" title="Выйти из аккаунта">
              <LogoutIcon />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            value={queryState.q}
            onChange={(e) => updateParams({ q: e.target.value, page: '1' })}
            placeholder="Поиск по названию"
            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
          />
          {role === 'admin' && (
            <input
              value={queryState.ownerIdRaw}
              onChange={(e) => updateParams({ owner_id: e.target.value, page: '1' })}
              placeholder="owner_id"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          )}
          <input
            value={queryState.minMessagesRaw}
            onChange={(e) => updateParams({ min_messages: e.target.value, page: '1' })}
            placeholder="Мин. сообщений"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={queryState.hasImagesRaw}
            onChange={(e) => updateParams({ has_images: e.target.value, page: '1' })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">С изображениями: любые</option>
            <option value="true">Только с изображениями</option>
            <option value="false">Только без изображений</option>
          </select>
          <select
            value={queryState.sortBy}
            onChange={(e) => updateParams({ sort_by: e.target.value, page: '1' })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="created_at">Сорт: дата создания</option>
            <option value="title">Сорт: название</option>
            <option value="messages_count">Сорт: число сообщений</option>
            <option value="last_activity_at">Сорт: активность</option>
          </select>
          <select
            value={queryState.sortOrder}
            onChange={(e) => updateParams({ sort_order: e.target.value, page: '1' })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </select>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {chats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatIcon />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Чатов пока нет</h3>
            <p className="text-gray-500 mb-6">Попробуйте изменить фильтры или создайте новый чат</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all">
                {deleteConfirmId === c.id ? (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-red-600 font-medium">Удалить этот чат?</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => handleConfirmDelete(c.id, e)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Удалить</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <Link to={`/chats/${c.id}`} className="block p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><ChatIcon /></div>
                      <div className="flex-1 min-w-0">
                        {editingId === c.id ? (
                          <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
                            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus className="flex-1 px-2 py-1 border-2 border-indigo-500 rounded-lg text-sm focus:outline-none" />
                            <button onClick={(e) => handleSaveEdit(c.id, e)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckIcon /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><XIcon /></button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                            <p className="text-sm text-gray-500">
                              {c.owner_username ? `${c.owner_username} · ` : ''}
                              сообщений: {c.messages_count ?? 0}
                              {c.has_images ? ' · с изображениями' : ''}
                            </p>
                          </>
                        )}
                      </div>
                      {editingId !== c.id && (
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => handleStartEdit(c, e)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Переименовать чат"><EditIcon /></button>
                          <button onClick={(e) => handleDeleteClick(c.id, e)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Удалить чат"><TrashIcon /></button>
                        </div>
                      )}
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <span>Всего: {total}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={queryState.page <= 1}
              onClick={() => updateParams({ page: String(queryState.page - 1) })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Назад
            </button>
            <span>Стр. {queryState.page} / {pages}</span>
            <button
              disabled={queryState.page >= pages}
              onClick={() => updateParams({ page: String(queryState.page + 1) })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Вперед
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
