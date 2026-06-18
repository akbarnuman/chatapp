import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6V10h12v2zm0-3H6V7h12v2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">ChatApp</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time messaging, reimagined</p>
        </div>

        <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 p-8">
          {/* Tab switcher */}
          <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
            {['Login', 'Register'].map((tab, i) => (
              <button key={tab} onClick={() => setIsLogin(i === 0)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  isLogin === (i === 0)
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Username</label>
                <input
                  type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="johndoe" required minLength={3}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder-gray-500"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
              <input
                type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com" required
                className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder-gray-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
              <input
                type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" required minLength={6}
                className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder-gray-500"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isLogin ? 'Signing in...' : 'Creating account...'}</>
              ) : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
