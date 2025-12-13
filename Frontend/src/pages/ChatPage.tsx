import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { chatsApi } from '../api/chats';
import type { Message, ChatDetails } from '../types/chat';

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const AttachIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

export const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatId) return;
    let mounted = true;
    
    chatsApi.getChat(Number(chatId)).then(data => {
      if (mounted) setChatDetails(data);
    }).catch(() => {});
    
    chatsApi.getMessages(Number(chatId)).then(data => {
      if (mounted) setMessages(data);
    }).catch(() => {});
    
    return () => { mounted = false };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditTitle(chatDetails?.title || '');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !chatId) return;
    try {
      const updated = await chatsApi.updateChat(Number(chatId), { title: editTitle.trim() });
      setChatDetails(updated);
      setIsEditing(false);
    } catch (e) {}
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
  };

  const handleDelete = async () => {
    if (!chatId) return;
    try {
      await chatsApi.deleteChat(Number(chatId));
      navigate('/chats');
    } catch (e) {}
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!content.trim() && !selectedFile) || !chatId) return;
    
    setLoading(true);
    try {
      if (selectedFile) {
        setUploading(true);
        const userMessage = await chatsApi.sendMessage(Number(chatId), {
          sender: 'user',
          content: content.trim() || `Загружено: ${selectedFile.name}`,
          image_url: previewUrl || undefined
        });
        setMessages(prev => [...prev, userMessage]);
        
        const redactResult = await chatsApi.uploadFile(selectedFile);
        
        let resultContent = `Обнаружено номеров: ${redactResult.detections_count}`;
        if (redactResult.detections.length > 0) {
          resultContent += '\n\nНайденные области:';
          redactResult.detections.forEach((det, i) => {
            resultContent += `\n${i + 1}. [${det.x1}, ${det.y1}] - [${det.x2}, ${det.y2}] (${Math.round(det.confidence * 100)}%)`;
          });
        }
        
        const botMessage = await chatsApi.sendMessage(Number(chatId), {
          sender: 'assistant',
          content: resultContent,
          image_url: redactResult.redacted_image_base64 
            ? `data:image/png;base64,${redactResult.redacted_image_base64}` 
            : undefined
        });
        setMessages(prev => [...prev, botMessage]);
        
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploading(false);
      } else {
        const userMessage = await chatsApi.sendMessage(Number(chatId), {
          sender: 'user',
          content: content.trim()
        });
        setMessages(prev => [...prev, userMessage]);

        setTimeout(async () => {
          try {
            const botMessage = await chatsApi.sendMessage(Number(chatId), {
              sender: 'assistant',
              content: `Загрузите изображение для обработки`
            });
            setMessages(prev => [...prev, botMessage]);
          } catch (e) {}
        }, 500);
      }
      setContent('');
    } catch (e) {
      setUploading(false);
      const errorMessage = await chatsApi.sendMessage(Number(chatId), {
        sender: 'assistant',
        content: `Ошибка обработки. Попробуйте еще раз.`
      });
      setMessages(prev => [...prev, errorMessage]);
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
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm shrink-0">
        <Link to="/chats" className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeftIcon />
        </Link>
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
                className="px-3 py-1.5 border-2 border-indigo-500 rounded-lg text-base font-semibold focus:outline-none"
              />
              <button
                onClick={handleSaveEdit}
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
              <h2 className="text-lg font-semibold text-gray-900">
                {chatDetails?.title || 'Загрузка...'}
              </h2>
              <p className="text-sm text-gray-500">Загрузите изображения для скрытия данных</p>
            </>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleStartEdit}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Переименовать чат"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Удалить чат"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
          <span className="text-red-700 font-medium">Вы уверены, что хотите удалить этот чат?</span>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Удалить
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <ImageIcon />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Готов к обработке</h3>
          <p className="text-gray-500 max-w-md">
            Загрузите изображение с номерными знаками или другими данными для автоматического скрытия
          </p>
        </div>
      ) : (
        <div className="flex-1 p-6 space-y-4 min-h-0 overflow-y-auto">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.image_url && (
                  <img src={msg.image_url} alt="" className="mt-2 rounded-lg max-w-full max-h-64 object-contain" />
                )}
                <p className={`text-xs mt-2 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="bg-white border-t p-4 shadow-lg shrink-0">
        <div className="max-w-4xl mx-auto">
          {selectedFile && previewUrl && (
            <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
              <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex gap-3 items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-colors disabled:opacity-50"
            >
              <AttachIcon />
            </button>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFile ? "Добавьте сообщение (необязательно)..." : "Введите сообщение или прикрепите изображение..."}
              rows={2}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-indigo-500 text-base min-h-[52px] max-h-32"
            />
            <button
              onClick={handleSend}
              disabled={loading || (!content.trim() && !selectedFile)}
              className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
