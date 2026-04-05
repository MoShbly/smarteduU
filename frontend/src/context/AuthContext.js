'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { apiRequest } from '@/lib/api';
import { clearAuthSession, getStoredSession, setAuthSession } from '@/lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const session = getStoredSession();

      if (!session?.token) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await apiRequest('/auth/me', {
          token: session.token
        });

        if (!isMounted) {
          return;
        }

        setToken(session.token);
        setUser(response.data.user);
        setAuthSession(session.token, response.data.user);
      } catch (error) {
        clearAuthSession();

        if (isMounted) {
          setUser(null);
          setToken('');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (payload) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: payload
    });

    const authSession = response.data;
    setAuthSession(authSession.token, authSession.user);
    setToken(authSession.token);
    setUser(authSession.user);

    return authSession;
  };

  const register = async (payload) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: payload
    });

    const authSession = response.data;
    setAuthSession(authSession.token, authSession.user);
    setToken(authSession.token);
    setUser(authSession.user);

    return authSession;
  };

  const logout = () => {
    clearAuthSession();
    setToken('');
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
