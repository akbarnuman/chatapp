import React, { useState } from 'react';
import { format } from 'date-fns';
import { emitReaction, emitDeleteMessage } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

const UPLOADS = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({ message, conversationId, onReply, isGroup }) {
  const { user } = useAuth();
  const isMine = message.sender?._id === user._id || message.sender === user._id;
  const [showActions, setShowActions] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const handleReact = (emoji) => {
    emitReaction(message._id, emoji, conversationId);
    setShowEmojis(false);
    setShowActions(false);
  };

  const handleDelete = (forEveryone) => {
    emitDeleteMessage(message._id, conversationId, forEveryone);
    setShowActions(false);
  };

  if (message.type === 'system') {
    return <div className="text-center py-1"><span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">{message.content}</span></div>;
  }

  const reactions = message.reactions?.filter(r => r.users?.length > 0) || [];

  return (
    <div className={`group flex items-end gap-2 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseLeave={() => { setShowActions(false); setShowEmojis(false); }}>

      {isGroup && !isMine && <Avatar user={message.sender} size="xs" />}

      <div className={`relative max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {isGroup && !isMine && (
          <span className="text-xs text-emerald-400 font-medium mb-1 ml-1">{message.sender?.username}</span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={`text-xs px-3 py-1.5 mb-1 rounded-t-xl border-l-2 border-emerald-400 ${isMine ? 'bg-gray-600 text-gray-300' : 'bg-gray-700 text-gray-300'}`}>
            <span className="font-medium text-emerald-400">{message.replyTo.sender?.username || 'User'}</span>
            <p className="truncate opacity-80">{message.replyTo.content || '📎 Attachment'}</p>
          </div>
        )}

        <div
          onMouseEnter={() => setShowActions(true)}
          className={`relative px-4 py-2.5 rounded-2xl break-words leading-relaxed text-sm shadow-sm
            ${isMine
              ? 'bg-emerald-600 text-white rounded-br-sm'
              : 'bg-gray-800 text-gray-100 rounded-bl-sm'}
            ${message.isPending ? 'opacity-70' : ''}
            ${message.isDeleted ? 'italic opacity-60' : ''}
          `}>

          {/* Content */}
          {message.isDeleted ? (
            <span className="flex items-center gap-1">🚫 This message was deleted</span>
          ) : message.type === 'image' ? (
            <a href={`${UPLOADS}${message.fileUrl}`} target="_blank" rel="noreferrer">
              <img src={`${UPLOADS}${message.fileUrl}`} alt="img" className="max-w-[240px] rounded-xl cursor-pointer hover:opacity-90 transition"/>
            </a>
          ) : message.type === 'voice' ? (
            <div className="flex items-center gap-2 min-w-[160px]">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
              </svg>
              <span className="text-xs">Voice message</span>
              {message.duration && <span className="text-xs opacity-70">{Math.round(message.duration)}s</span>}
            </div>
          ) : message.type === 'file' ? (
            <a href={`${UPLOADS}${message.fileUrl}`} download={message.fileName}
              className="flex items-center gap-2 hover:underline">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
              </svg>
              <span className="text-xs">{message.fileName || 'File'}</span>
            </a>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Time + status */}
          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isMine ? 'text-emerald-200' : 'text-gray-500'}`}>
              {message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : ''}
            </span>
            {isMine && !message.isDeleted && (
              <span className={`text-[10px] ${message.status === 'read' ? 'text-blue-300' : 'text-emerald-200'}`}>
                {message.isPending ? '⏳' : message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
              </span>
            )}
          </div>

          {/* Pin indicator */}
          {message.isPinned && <span className="absolute -top-1.5 -right-1 text-xs">📌</span>}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reactions.map(r => (
              <button key={r.emoji} onClick={() => handleReact(r.emoji)}
                className="flex items-center gap-0.5 bg-gray-800 hover:bg-gray-700 rounded-full px-1.5 py-0.5 text-xs border border-gray-700 transition">
                {r.emoji} <span className="text-gray-400">{r.users?.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && !message.isDeleted && (
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <button onClick={() => setShowEmojis(!showEmojis)}
            className="w-7 h-7 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-sm transition">
            😊
          </button>
          <button onClick={() => { onReply(message); setShowActions(false); }}
            className="w-7 h-7 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
            </svg>
          </button>
          {isMine && (
            <button onClick={() => handleDelete(true)}
              className="w-7 h-7 bg-gray-800 hover:bg-red-900 rounded-full flex items-center justify-center transition">
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Emoji picker */}
      {showEmojis && (
        <div className={`absolute z-10 flex gap-1 bg-gray-800 border border-gray-700 rounded-2xl p-2 shadow-xl ${isMine ? 'right-10' : 'left-10'} bottom-8`}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => handleReact(e)} className="hover:scale-125 transition-transform text-lg">
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
