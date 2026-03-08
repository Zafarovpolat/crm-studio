import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка входа';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Ошибка регистрации';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data });
    } catch {
      // Если токен протух — выйти
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null });
    }
  },
}));

export default useAuthStore;
