import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const getDashboardUrl = (user) => {
  if (!user) return '/login';
  
  if (user.role === 'admin' || user.role === 'govt_dept') {
    if (!user.is_verified) return '/pending-approval';
    return '/admin/dashboard';
  }
  if (user.role === 'citizen') {
    return '/citizen/dashboard';
  }
  if (user.role === 'faculty' || user.role === 'student') {
    return '/institution/dashboard';
  }
  if (user.role === 'industry') {
    return '/industry/dashboard';
  }
  return '/citizen/dashboard';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('samasyasetu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('samasyasetu_token'));
  const [loading, setLoading] = useState(true);

  // Restore & verify session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('samasyasetu_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('samasyasetu_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.warn('Session restoration failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token: newToken, user: newUser } = res.data;

    localStorage.setItem('samasyasetu_token', newToken);
    localStorage.setItem('samasyasetu_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    return { user: newUser, redirectUrl: getDashboardUrl(newUser) };
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: newToken, user: newUser } = res.data;

    if (newToken) {
      localStorage.setItem('samasyasetu_token', newToken);
      localStorage.setItem('samasyasetu_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    }

    return { user: newUser, redirectUrl: getDashboardUrl(newUser) };
  };

  const logout = () => {
    localStorage.removeItem('samasyasetu_token');
    localStorage.removeItem('samasyasetu_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, getDashboardUrl }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
