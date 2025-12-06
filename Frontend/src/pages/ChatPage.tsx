import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { chatsApi } from '../api/chats';
import { Message } from '../types/chat';
import { Button } from '../components/ui/Button';

export const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;
    let mounted = true;
    chatsApi.getMessages(Number(chatId)).then(data => {
      if (mounted) setMessages(data);
    }).catch(() => {});
    return () => { mounted = false };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || !chatId) return;
    setLoading(true);
    try {
      const userMessage = await chatsApi.sendMessage(Number(chatId), {
        sender: 'user',
        content: content.trim()
      });
      setMessages(prev => [...prev, userMessage]);
      setContent('');

      setTimeout(async () => {
        try {
          const botMessage = await chatsApi.sendMessage(Number(chatId), {
            sender: 'assistant',
            content: `Response to: "${userMessage.content}"`
          });
          setMessages(prev => [...prev, botMessage]);
        } catch (e) {}
      }, 500);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/chats" className="text-indigo-600 hover:text-indigo-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-semibold">Chat #{chatId}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.image_url && (
                <img src={msg.image_url} alt="" className="mt-2 rounded max-w-full" />
              )}
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                {new Date(msg.created_at || '').toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-indigo-500"
          />
          <Button onClick={handleSend} isLoading={loading} variant="gradient">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
