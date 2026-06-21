import React, { useState, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import Avatar from '../ui/Avatar';
import NewChatModal from './NewChatModal';
import ProfileModal from './ProfileModal';
import UserProfileModal from './UserProfileModal';

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd/MM/yy');
}

export default function Sidebar() {
  const { conversations, activeConversation, selectConversation, onlineUsers } = useChat();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await userAPI.getUsers({ search });
        setSearchResults(data.users);
      } catch {} finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const getOtherParticipant = (conv) => conv.isGroup
    ? null : conv.participants?.find(p => p._id !== user._id);

  const getUnread = (conv) => {
    if (!conv.unreadCount) return 0;
    return conv.unreadCount[user._id] || 0;
  };

  const filtered = conversations.filter(c => {
    const other = getOtherParticipant(c);
    const name = c.isGroup ? c.groupName : other?.username || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="w-80 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3">
        <button onClick={() => setShowProfile(true)}>
          <Avatar user={user} size="sm" showOnline isOnline />
        </button>
        <h1 className="font-bold text-white flex-1">Messages</h1>
        <button onClick={() => setShowNew(true)}
          className="w-8 h-8 bg-emerald-500 hover:bg-emerald-400 rounded-lg flex items-center justify-center transition">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
          </svg>
        </button>
        <button onClick={logout} className="w-8 h-8 text-gray-400 hover:text-red-400 flex items-center justify-center rounded-lg hover:bg-gray-800 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-800">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search or start new chat..."
            className="w-full bg-gray-800 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-500 border border-gray-700"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">✕</button>}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {search && searchResults.length > 0 && (
          <div className="p-2">
            <p className="text-xs text-gray-500 px-2 py-1 font-medium uppercase tracking-wider">People</p>
            {searchResults.map(u => (
              <SearchUserItem key={u._id} u={u} onlineUsers={onlineUsers}
                onSelect={() => { setSearch(''); }}
                onViewProfile={() => setViewingUserId(u._id)}
                user={user} />
            ))}
          </div>
        )}

        {(!search || searchResults.length === 0) && filtered.map(conv => {
          const other = getOtherParticipant(conv);
          const unread = getUnread(conv);
          const isActive = activeConversation?._id === conv._id;
          const isOnline = other ? onlineUsers.has(other._id) : false;
          const lastMsg = conv.lastMessage;

          return (
            <button key={conv._id} onClick={() => selectConversation(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition text-left ${isActive ? 'bg-gray-800 border-r-2 border-emerald-500' : ''}`}>
              <Avatar user={conv.isGroup ? { username: conv.groupName } : other} showOnline isOnline={isOnline} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm truncate">{conv.isGroup ? conv.groupName : other?.username}</span>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{formatTime(conv.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-400 truncate">
                    {lastMsg?.isDeleted ? '🚫 Message deleted'
                      : lastMsg?.type === 'image' ? '📷 Photo'
                      : lastMsg?.type === 'voice' ? '🎤 Voice message'
                      : lastMsg?.type === 'file' ? '📎 File'
                      : lastMsg?.content || 'Start a conversation'}
                  </p>
                  {unread > 0 && (
                    <span className="ml-2 flex-shrink-0 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {!search && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Click + to start chatting</p>
          </div>
        )}
      </div>

      {showNew && <NewChatModal onClose={() => setShowNew(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {viewingUserId && <UserProfileModal userId={viewingUserId} onClose={() => setViewingUserId(null)} />}
    </div>
  );
}

function SearchUserItem({ u, onlineUsers, onSelect, onViewProfile, user: currentUser }) {
  const { createConversation, selectConversation } = useChat();
  const handle = async () => {
    const conv = await createConversation({ participantId: u._id });
    selectConversation(conv);
    onSelect();
  };
  return (
    <div className="flex items-center gap-2 px-1">
      <button onClick={handle} className="flex-1 flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 rounded-xl transition text-left">
        <Avatar user={u} showOnline isOnline={onlineUsers.has(u._id)} />
        <div>
          <p className="text-white text-sm font-medium">{u.username}</p>
          <p className="text-gray-400 text-xs">{onlineUsers.has(u._id) ? 'Online' : 'Offline'}</p>
        </div>
      </button>
      <button onClick={onViewProfile}
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition flex-shrink-0"
        title="View profile">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
      </button>
    </div>
  );
}
