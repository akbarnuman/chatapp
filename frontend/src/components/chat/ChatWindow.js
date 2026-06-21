import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { emitTyping, emitStopTyping, emitMarkRead } from '../../services/socket';
import { messageAPI } from '../../services/api';
import MessageBubble from './MessageBubble';
import Avatar from '../ui/Avatar';
import UserProfileModal from './UserProfileModal';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { format, isToday, isYesterday } from 'date-fns';

function dateSeparator(date) {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
}

export default function ChatWindow() {
  const [activeReactionId, setActiveReactionId] = useState(null);
  const { activeConversation, messages, typingUsers, loadMessages, hasMore, page, onlineUsers, setMessages } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [viewingUserId, setViewingUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const mediaRecorder = useRef(null);
  const fileInputRef = useRef(null);

  const [waveform, setWaveform] = useState([]);
const audioContext = useRef(null);
const analyser = useRef(null);
const animationFrame = useRef(null);

  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimer = useRef(null);

  

  const other = activeConversation?.isGroup ? null
    : activeConversation?.participants?.find(p => p._id !== user._id);

  const isOtherOnline = other ? onlineUsers.has(other._id) : false;
  const currentTyping = typingUsers[activeConversation?._id];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeConversation) return;
    const unread = messages.filter(m => m.sender?._id !== user._id && m.status !== 'read').map(m => m._id);
    if (unread.length > 0) emitMarkRead(activeConversation._id, unread);
  }, [messages, activeConversation, user._id]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!activeConversation) return;
    emitTyping(activeConversation._id);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(activeConversation._id), 2000);
  };

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !activeConversation) return;
    const { sendMessage } = window.__chatCtx || {};
    emitStopTyping(activeConversation._id);
    setInput('');
    setReplyTo(null);
    setShowEmoji(false);
    // Use socket directly via context
    const socket = require('../../services/socket').getSocket();
    if (!socket) return;
    const tempId = Date.now().toString();
    const tempMsg = {
      _id: tempId, tempId, content: text, type: 'text',
      sender: user, conversationId: activeConversation._id,
      createdAt: new Date(), status: 'sent', replyTo, reactions: [], isPending: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    socket.emit('send_message', { conversationId: activeConversation._id, content: text, type: 'text', replyTo: replyTo?._id, tempId });
  }, [input, activeConversation, replyTo, user, setMessages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('conversationId', activeConversation._id);
      const { data } = await messageAPI.sendMessage(fd);
      setMessages(prev => [...prev, data.message]);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new AudioContext();

const source = audioContext.current.createMediaStreamSource(stream);

analyser.current = audioContext.current.createAnalyser();
analyser.current.fftSize = 64;

source.connect(analyser.current);

const dataArray = new Uint8Array(analyser.current.frequencyBinCount);

const updateWaveform = () => {
  analyser.current.getByteFrequencyData(dataArray);

  const values = Array.from(dataArray).slice(0, 20);

  setWaveform(values);

  animationFrame.current = requestAnimationFrame(updateWaveform);
};

updateWaveform();
      const chunks = [];
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('file', blob, 'voice.webm');
        fd.append('conversationId', activeConversation._id);
        setUploading(true);
        try {
          const { data } = await messageAPI.sendMessage(fd);
          setMessages(prev => [...prev, data.message]);
        } catch { toast.error('Failed to send voice message'); }
        finally { setUploading(false); }
      };
      mediaRecorder.current.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

recordingTimer.current = setInterval(() => {
  setRecordingTime(prev => prev + 1);
}, 1000);
    } catch { toast.error('Microphone access denied'); }
  };

  const stopRecording = () => {
  if (
    mediaRecorder.current &&
    mediaRecorder.current.state !== 'inactive'
  ) {
    mediaRecorder.current.stop();
  }

  clearInterval(recordingTimer.current);
  recordingTimer.current = null;

  setIsRecording(false);
  cancelAnimationFrame(animationFrame.current);

if (audioContext.current) {
  audioContext.current.close();
}

setWaveform([]);
};

  const loadMore = () => loadMessages(activeConversation._id, page + 1);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-400">Select a conversation</h2>
          <p className="text-gray-600 text-sm mt-2">Choose from your existing chats or start a new one</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  messages.forEach(m => {
    const d = dateSeparator(m.createdAt);
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d; }
    grouped.push({ type: 'msg', data: m });
  });

  const filteredGrouped = grouped.filter(item => {
  if (!searchText.trim()) return true;

  if (item.type === 'date') return true;

  return item.data.content
    ?.toLowerCase()
    .includes(searchText.toLowerCase());
});

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900 flex items-center gap-3">
        <button onClick={() => !activeConversation.isGroup && other && setViewingUserId(other._id)}
          className={!activeConversation.isGroup ? 'cursor-pointer' : 'cursor-default'}>
          <Avatar user={activeConversation.isGroup ? { username: activeConversation.groupName } : other}
            showOnline isOnline={isOtherOnline} />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => !activeConversation.isGroup && other && setViewingUserId(other._id)}
            className={`font-semibold text-white text-sm truncate block ${!activeConversation.isGroup ? 'hover:text-emerald-400 transition' : ''}`}>
            {activeConversation.isGroup ? activeConversation.groupName : other?.username}
          </button>
          <p className="text-xs text-gray-400">
            {activeConversation.isGroup
              ? `${activeConversation.participants?.length} members`
              : isOtherOnline ? '🟢 Online' : other?.lastSeen ? `Last seen ${format(new Date(other.lastSeen), 'HH:mm')}` : 'Offline'
            }
          </p>
        </div>
        <button
  onClick={() => setSearchOpen(prev => !prev)}
  className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg flex items-center justify-center transition"
>
  {searchOpen && (
  <input
    autoFocus
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    placeholder="Search messages..."
    className="absolute top-14 right-4 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 outline-none"
  />
)}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>
      </div>

      {/* Pinned messages */}
      {activeConversation.pinnedMessages?.length > 0 && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2">
          <span className="text-xs">📌</span>
          <span className="text-xs text-yellow-400">{activeConversation.pinnedMessages.length} pinned message(s)</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5" onClick={() => setShowEmoji(false)}>
        {hasMore && (
          <div className="text-center mb-4">
            <button onClick={loadMore} className="text-xs text-emerald-400 hover:text-emerald-300 bg-gray-800 px-3 py-1.5 rounded-full transition">
              Load earlier messages
            </button>
          </div>
        )}

        

        {filteredGrouped.map((item, i) => item.type === 'date'
          ? <div key={i} className="text-center py-3"><span className="text-xs text-gray-500 bg-gray-800/80 px-3 py-1 rounded-full">{item.label}</span></div>
          : <MessageBubble 
    key={item.data._id || item.data.tempId}
    message={item.data}
    conversationId={activeConversation._id}
    onReply={setReplyTo}
    isGroup={activeConversation.isGroup}
    onSenderClick={(uid) => setViewingUserId(uid)}
    activeReactionId={activeReactionId}
    setActiveReactionId={setActiveReactionId}
/>
        )}

        {currentTyping && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex gap-1 bg-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-500">{currentTyping.username} is typing</span>
          </div>
        )}

        {uploading && (
          <div className="flex justify-end">
            <div className="bg-emerald-600/50 px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              Uploading...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex items-center gap-3">
          <div className="flex-1 border-l-2 border-emerald-400 pl-3">
            <p className="text-xs text-emerald-400 font-medium">{replyTo.sender?.username}</p>
            <p className="text-xs text-gray-400 truncate">{replyTo.content || 'Attachment'}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-white text-lg">✕</button>
        </div>
      )}

      {viewingUserId && (
        <UserProfileModal
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
        />
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        {showEmoji && (
          <div className="absolute bottom-24 left-80 z-20">
            <EmojiPicker onEmojiClick={(e) => setInput(prev => prev + e.emoji)} theme="dark" height={350} />
          </div>
        )}

        <div className="flex items-end gap-2">
          <button onClick={() => setShowEmoji(!showEmoji)}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-yellow-400 transition text-xl flex-shrink-0">
            😊
          </button>

          <button onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-emerald-400 transition flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
            </svg>
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile}
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"/>

          <textarea ref={inputRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown}
            placeholder="Type a message..." rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 resize-none placeholder-gray-500 max-h-32 leading-relaxed"
            style={{ height: 'auto' }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; }}
          />
{isRecording && (
  <div className="flex items-center gap-1 px-2">

    <span className="text-red-400 text-sm">
      🔴 {Math.floor(recordingTime / 60)}:
      {(recordingTime % 60).toString().padStart(2,'0')}
    </span>

    <div className="flex items-center gap-[2px] h-6">
      {waveform.map((value, index) => (
        <span
          key={index}
          className="w-[3px] bg-emerald-400 rounded-full transition-all"
          style={{
            height: `${Math.max(4, value / 3)}px`
          }}
        />
      ))}
    </div>

  </div>
)}
          {input.trim() ? (
            <button onClick={handleSend}
              className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center transition flex-shrink-0 shadow-lg shadow-emerald-500/25">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          ) : (
            <button
  onClick={() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }}
  className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${
    isRecording
      ? 'bg-red-500 animate-pulse'
      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
  }`}
>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
