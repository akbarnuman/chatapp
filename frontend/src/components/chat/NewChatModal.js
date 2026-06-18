import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { useChat } from '../../context/ChatContext';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

export default function NewChatModal({ onClose }) {
  const [tab, setTab] = useState('dm');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { createConversation, selectConversation } = useChat();

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { data } = await userAPI.getUsers({ search });
        setUsers(data.users);
      } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (tab === 'dm') {
        if (!selected[0]) return toast.error('Select a user');
        const conv = await createConversation({ participantId: selected[0]._id });
        selectConversation(conv);
        onClose();
      } else {
        if (!groupName.trim()) return toast.error('Enter a group name');
        if (selected.length < 2) return toast.error('Select at least 2 members');
        const conv = await createConversation({ isGroup: true, groupName, participants: selected.map(u => u._id) });
        selectConversation(conv);
        onClose();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const toggle = (u) => {
    if (tab === 'dm') { setSelected([u]); return; }
    setSelected(prev => prev.find(p => p._id === u._id) ? prev.filter(p => p._id !== u._id) : [...prev, u]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">New Conversation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex bg-gray-800 rounded-xl p-1">
            {['dm', 'group'].map(t => (
              <button key={t} onClick={() => { setTab(t); setSelected([]); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t === 'dm' ? 'Direct Message' : 'New Group'}
              </button>
            ))}
          </div>

          {tab === 'group' && (
            <input value={groupName} onChange={e => setGroupName(e.target.value)}
              placeholder="Group name..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-500"/>
          )}

          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-500"/>

          {selected.length > 0 && tab === 'group' && (
            <div className="flex gap-2 flex-wrap">
              {selected.map(u => (
                <span key={u._id} onClick={() => toggle(u)}
                  className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-lg cursor-pointer hover:bg-emerald-500/30">
                  {u.username} ✕
                </span>
              ))}
            </div>
          )}

          <div className="max-h-52 overflow-y-auto space-y-1">
            {users.map(u => (
              <button key={u._id} onClick={() => toggle(u)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left ${selected.find(s => s._id === u._id) ? 'bg-emerald-500/20 border border-emerald-500/50' : 'hover:bg-gray-800'}`}>
                <Avatar user={u} size="sm" />
                <div>
                  <p className="text-white text-sm font-medium">{u.username}</p>
                  <p className="text-gray-400 text-xs">{u.email}</p>
                </div>
                {selected.find(s => s._id === u._id) && <span className="ml-auto text-emerald-400">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleCreate} disabled={loading || selected.length === 0}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition">
            {loading ? 'Creating...' : tab === 'dm' ? 'Start Chat' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
