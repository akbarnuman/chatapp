import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

export default function ProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ username: user.username, bio: user.bio || '' });
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('username', form.username);
      fd.append('bio', form.bio);
      if (file) fd.append('profilePicture', file);
      const { data } = await userAPI.updateUser(user._id, fd);
      updateUser(data.user);
      toast.success('Profile updated!');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="preview" className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-500"/>
              ) : (
                <Avatar user={user} size="xl" />
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
            <p className="text-xs text-gray-400">Click to change avatar</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Username</label>
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})}
              className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-500"/>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
              rows={3} maxLength={200} placeholder="Tell people about yourself..."
              className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 resize-none placeholder-gray-500"/>
            <p className="text-right text-xs text-gray-500 mt-1">{form.bio.length}/200</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm transition">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
