import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
  // restore user session
=======
  // Boot: restore session
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await authAPI.getMe();
        setUser(data.user);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const saveTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  };

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
<<<<<<< HEAD
    toast.success(`Welcome, ${data.user.firstName}!`);
=======
    toast.success(`Welcome to SubSync AI, ${data.user.firstName}! 🎉`);
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    return data;
  }, []);

  const login = useCallback(async (formData) => {
    const { data } = await authAPI.login(formData);
    saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
<<<<<<< HEAD
    toast.success(`Welcome back, ${data.user.firstName}!`);
=======
    toast.success(`Welcome back, ${data.user.firstName}! 👋`);
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    return data;
  }, []);

  const googleLogin = useCallback(async (googleData) => {
    const { data } = await authAPI.googleAuth(googleData);
    saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
<<<<<<< HEAD
    toast.success(`Welcome, ${data.user.firstName}!`);
=======
    toast.success(`Welcome, ${data.user.firstName}! 🚀`);
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    setUser(null);
    toast.success('Logged out successfully.');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, googleLogin, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
