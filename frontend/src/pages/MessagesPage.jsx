import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiSend, FiMessageCircle, FiArrowLeft, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { messagesAPI, usersAPI } from '../api/index.js';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function MessagesPage() {
  const { userId: paramUserId } = useParams();
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [activeConv, setActiveConv] = useState(paramUserId ? parseInt(paramUserId) : null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (paramUserId) {
      setActiveConv(parseInt(paramUserId));
    }
  }, [paramUserId]);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv);
      loadOtherUser(activeConv);
      // Poll for new messages every 5 seconds
      pollingRef.current = setInterval(() => loadMessages(activeConv, true), 5000);
    }
    return () => clearInterval(pollingRef.current);
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data);
    } catch {}
    setLoading(false);
  };

  const loadMessages = async (userId, silent = false) => {
    try {
      const res = await messagesAPI.getMessages(userId);
      setMessages(res.data);
    } catch {}
  };

  const loadOtherUser = async (userId) => {
    try {
      const res = await usersAPI.getById(userId);
      setOtherUser(res.data);
    } catch {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;
    setSending(true);
    const text = messageText.trim();
    setMessageText('');
    try {
      const res = await messagesAPI.send({ receiver_id: activeConv, text });
      setMessages(prev => [...prev, res.data]);
      await loadConversations();
    } catch {
      toast.error(t('somethingWrong'));
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const openConversation = (conv) => {
    const otherId = conv.other_user_id;
    setActiveConv(otherId);
    navigate(`/messages/${otherId}`, { replace: true });
  };

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-8rem)] flex border-t border-gray-100 overflow-hidden">
      {/* Sidebar - Conversations */}
      <aside className={`${activeConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 bg-white`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <FiMessageCircle size={18} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{t('messagesTitle')}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="skeleton w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/2 rounded" />
                    <div className="skeleton h-3 w-3/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <FiMessageCircle size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{t('noMessages')}</p>
              <p className="text-gray-400 text-xs mt-1">{t('noMessagesHint')}</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${
                  activeConv === conv.other_user_id ? 'bg-primary-50 border-primary-100' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.other_user_avatar || `https://i.pravatar.cc/48?u=${conv.other_user_id}`}
                    alt={conv.other_user_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-gray-900 text-sm truncate">{conv.other_user_name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatTime(conv.created_at)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                    {conv.sender_id === user.id && 'Вы: '}{conv.text}
                  </p>
                  {conv.listing_title && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">📦 {conv.listing_title}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat area */}
      <main className={`${activeConv ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FiMessageCircle size={52} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('selectConversation')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
              <button
                onClick={() => { setActiveConv(null); navigate('/messages', { replace: true }); }}
                className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiArrowLeft size={20} />
              </button>
              {otherUser && (
                <>
                  <Link to={`/profile/${otherUser.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img
                      src={otherUser.avatar || `https://i.pravatar.cc/48?u=${otherUser.id}`}
                      alt={otherUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{otherUser.name}</div>
                      {otherUser.city && <div className="text-xs text-gray-400">{otherUser.city}</div>}
                    </div>
                  </Link>
                  <div className="ml-auto">
                    <Link
                      to={`/profile/${otherUser.id}`}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Профиль →
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Начните разговор — напишите первое сообщение!
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === user.id;
                const showDate = i === 0 || new Date(messages[i-1].created_at).toDateString() !== new Date(msg.created_at).toDateString();
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="text-center">
                        <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
                          {new Date(msg.created_at).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!isMine && (
                        <img
                          src={msg.sender_avatar || `https://i.pravatar.cc/32?u=${msg.sender_id}`}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                      )}
                      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMine
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 px-1">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="bg-white border-t border-gray-100 p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                    placeholder={t('typeMessage')}
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                    style={{ maxHeight: '120px', overflowY: 'auto' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="w-11 h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-colors shadow-md shrink-0"
                >
                  <FiSend size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
