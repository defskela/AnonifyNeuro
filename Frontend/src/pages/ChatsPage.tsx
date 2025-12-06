import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { chatsApi } from '../api/chats';
import { ChatSummary } from '../types/chat';
import { Button } from '../components/ui/Button';

export const ChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    chatsApi.listChats().then(data => {
      if (mounted) setChats(data);
    }).catch(() => {});
    return () => { mounted = false };
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const newChat = await chatsApi.createChat({ title: title.trim() });
      setChats(prev => [newChat, ...prev]);
      setTitle('');
      navigate(`/chats/${newChat.id}`);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Chats</h2>
          <div className="w-64 flex gap-2">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New chat title" className="w-full px-3 py-2 border rounded" />
            <Button onClick={handleCreate} isLoading={loading}>New</Button>
          </div>
        </div>
        <ul className="space-y-3">
          {chats.map(c => (
            <li key={c.id} className="p-3 border rounded hover:bg-gray-50">
              <Link to={`/chats/${c.id}`} className="flex justify-between items-center">
                <span className="font-medium">{c.title}</span>
                <span className="text-sm text-gray-500">{new Date(c.created_at||'').toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
