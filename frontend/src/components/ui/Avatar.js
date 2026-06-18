import React from 'react';
const UPLOADS = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const colors = ['bg-purple-500','bg-blue-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-indigo-500','bg-pink-500','bg-teal-500'];
const getColor = (name='') => colors[name.charCodeAt(0) % colors.length];

export default function Avatar({ user, size = 'md', showOnline = false, isOnline = false }) {
  const sizes = { xs:'w-7 h-7 text-xs', sm:'w-9 h-9 text-sm', md:'w-11 h-11 text-sm', lg:'w-14 h-14 text-base', xl:'w-20 h-20 text-2xl' };
  const dotSizes = { xs:'w-2 h-2', sm:'w-2.5 h-2.5', md:'w-3 h-3', lg:'w-3.5 h-3.5', xl:'w-4 h-4' };
  const src = user?.profilePicture ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${UPLOADS}${user.profilePicture}`) : null;

  return (
    <div className="relative flex-shrink-0">
      {src ? (
        <img src={src} alt={user?.username} className={`${sizes[size]} rounded-full object-cover ring-2 ring-gray-800`} />
      ) : (
        <div className={`${sizes[size]} ${getColor(user?.username)} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-gray-800`}>
          {(user?.username || '?')[0].toUpperCase()}
        </div>
      )}
      {showOnline && (
        <span className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-2 border-gray-900 ${isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`} />
      )}
    </div>
  );
}
