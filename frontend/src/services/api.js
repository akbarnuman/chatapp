import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://chatapp-sim5.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Users
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => {
  if (data instanceof FormData) {
    return api.put(`/users/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
  return api.put(`/users/${id}`, data);
},
  blockUser: (id) => api.post(`/users/${id}/block`),
};

// Conversations
export const conversationAPI = {
  getConversations: () => api.get('/conversations'),
  createConversation: (data) => api.post('/conversations', data),
  updateConversation: (id, data) => api.put(`/conversations/${id}`, data),
  addMember: (id, userId) => api.post(`/conversations/${id}/members`, { userId }),
  removeMember: (id, userId) => api.delete(`/conversations/${id}/members/${userId}`),
};

// Messages
export const messageAPI = {
  getMessages: (conversationId, params) => api.get(`/messages/${conversationId}`, { params }),
  sendMessage: (data) => {
    if (data instanceof FormData) {
      return api.post('/messages', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/messages', data);
  },
  deleteMessage: (id, data) => api.delete(`/messages/${id}`, { data }),
  reactToMessage: (id, emoji) => api.post(`/messages/${id}/react`, { emoji }),
  pinMessage: (id) => api.post(`/messages/${id}/pin`),
  markRead: (conversationId) => api.post('/messages/read', { conversationId }),
};

export default api;
