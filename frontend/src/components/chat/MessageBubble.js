import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { emitReaction, emitDeleteMessage } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

const UPLOADS = process.env.REACT_APP_SOCKET_URL || 'https://chatapp-sim5.onrender.com';
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({ 
  message, 
  conversationId, 
  onReply, 
  isGroup, 
  onSenderClick,
  activeReactionId,
  setActiveReactionId
}) {  const { user } = useAuth();

  const isMine = message.sender?._id === user._id || message.sender === user._id;
  const [showActions, setShowActions] = useState(false);
  const emojiRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const audioRef = useRef(null);
const [playing, setPlaying] = useState(false);
const [progress, setProgress] = useState(0);
const [duration, setDuration] = useState(0);

const waveform = useRef(
  Array.from({length:30},()=>8+Math.random()*18)
).current;

const toggleAudio = () => {
  if (!audioRef.current) return;

  if (audioRef.current.paused) {
    audioRef.current.play();

if (!duration || !Number.isFinite(duration)) {
  setTimeout(() => {
    if (audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  }, 500);
}

setPlaying(true);
  } else {
    audioRef.current.pause();
    setPlaying(false);
  }
};


const handleTime = () => {
  if (!audioRef.current) return;

  setProgress(
    (audioRef.current.currentTime / audioRef.current.duration) * 100
  );
};


const seekAudio = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;

  audioRef.current.currentTime =
    percent * audioRef.current.duration;
};

  // Close emoji panel when clicking outside
  useEffect(() => {
  const handler = () => {
    if (activeReactionId) {
      setActiveReactionId(null);
    }
  };

  document.addEventListener('mousedown', handler);

  return () => {
    document.removeEventListener('mousedown', handler);
  };

}, [activeReactionId, setActiveReactionId]);

 const handleReact = (emoji) => {
  emitReaction(message._id, emoji, conversationId);
  setActiveReactionId(null);
  setShowActions(false);
};

  const handleDelete = (forEveryone) => {
    emitDeleteMessage(message._id, conversationId, forEveryone);
    setShowActions(false);
  };

  if (message.type === 'system') {
    return (
      <div className="text-center py-1">
        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">{message.content}</span>
      </div>
    );
  }

  const reactions = message.reactions?.filter(r => r.users?.length > 0) || [];

  return (
    <div
      className={`group flex items-end gap-2 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        // Don't close emoji panel on mouse leave — only close via click outside
      }}
    >
      {isGroup && !isMine && (
        <button onClick={() => onSenderClick?.(message.sender?._id)} className="flex-shrink-0 hover:opacity-80 transition">
          <Avatar user={message.sender} size="xs" />
        </button>
      )}

      <div className={`relative max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {isGroup && !isMine && (
          <button
            onClick={() => onSenderClick?.(message.sender?._id)}
            className="text-xs text-emerald-400 font-medium mb-1 ml-1 hover:text-emerald-300 transition"
          >
            {message.sender?.username}
          </button>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={`text-xs px-3 py-1.5 mb-1 rounded-t-xl border-l-2 border-emerald-400 ${isMine ? 'bg-gray-600 text-gray-300' : 'bg-gray-700 text-gray-300'}`}>
            <span className="font-medium text-emerald-400">{message.replyTo.sender?.username || 'User'}</span>
            <p className="truncate opacity-80">{message.replyTo.content || '📎 Attachment'}</p>
          </div>
        )}

        {/* Bubble */}
        <div className={`relative px-4 py-2.5 rounded-2xl break-words leading-relaxed text-sm shadow-sm
          ${isMine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'}
          ${message.isPending ? 'opacity-70' : ''}
          ${message.isDeleted ? 'italic opacity-60' : ''}
        `}>
          {message.isDeleted ? (
            <span className="flex items-center gap-1">🚫 This message was deleted</span>
          ) : message.type === 'image' ? (
            <a href={message.fileUrl} target="_blank" rel="noreferrer">
              <img src={message.fileUrl} alt="img" className="max-w-[240px] rounded-xl cursor-pointer hover:opacity-90 transition" />
            </a>
          ) : message.type === 'voice' ? (
            <div className="flex items-center gap-2 min-w-[220px]">
  <div className="flex items-center gap-3 min-w-[220px]">

<button
onClick={toggleAudio}
className="text-xl"
>
{playing ? "⏸️" : "▶️"}
</button>


<div
onClick={seekAudio}
className="flex items-center justify-center gap-1 flex-1 cursor-pointer h-8"
>

{waveform.map((height,i)=>(
<span
key={i}
className="w-[3px] bg-emerald-300 rounded-full"
style={{
height:`${height}px`,
opacity: i < progress/3 ? 1 : 0.4
}}
/>
))}

</div>

<span className="text-xs opacity-70">
{
 duration && isFinite(duration)
 ?
 `${Math.floor(duration / 60)}:${Math.floor(duration % 60)
 .toString()
 .padStart(2,'0')}`
 :
 "0:00"
}
</span>


<audio
  ref={audioRef}
  preload="metadata"
  src={message.fileUrl}
  onLoadedMetadata={(e) => {
    const d = e.currentTarget.duration;

    if (Number.isFinite(d)) {
      setDuration(d);
    }
  }}
  onTimeUpdate={handleTime}
  onEnded={() => {
    setPlaying(false);
    setProgress(0);
  }}
/>

</div>

  
</div>
          ) : message.type === 'file' ? (
            <a href={message.fileUrl}download={message.fileName} className="flex items-center gap-2 hover:underline">
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

        {/* Emoji panel — rendered INSIDE the bubble column so it stays in flow */}
        {activeReactionId === message._id && (
          <div
  ref={emojiRef}
  onMouseDown={(e)=>e.stopPropagation()}
  className={`absolute z-20 flex gap-1 bg-gray-800 border border-gray-700 rounded-2xl px-2 py-1.5 shadow-2xl bottom-full mb-2 ${isMine ? 'right-0' : 'left-0'}`}
>
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => handleReact(e)}
                className="hover:scale-125 transition-transform text-lg w-8 h-8 flex items-center justify-center"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons — shown on hover */}
      {showActions && !message.isDeleted && (
        <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <button
            ref={emojiButtonRef}
            onClick={(e) => {
  e.stopPropagation();

  setActiveReactionId(
    activeReactionId === message._id
      ? null
      : message._id
  );
}}
            className="w-7 h-7 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-sm transition"
            title="React"
          >
            😊
          </button>
          <button
            onClick={() => { 
  onReply(message); 
  setShowActions(false); 
  setActiveReactionId(null);
}}
            className="w-7 h-7 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition"
            title="Reply"
          >
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
            </svg>
          </button>
          {isMine && (
            <button
              onClick={() => handleDelete(true)}
              className="w-7 h-7 bg-gray-800 hover:bg-red-900 rounded-full flex items-center justify-center transition"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}