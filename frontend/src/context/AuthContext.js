'use client';

import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import { clearAuthSession, getStoredSession, setAuthSession } from '@/lib/auth';
import { authService } from '@/services/auth.service';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: '',
  loading: true
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_SESSION_SUCCESS':
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token
      };
    case 'AUTH_CLEAR':
      return {
        ...state,
        loading: false,
        user: null,
        token: ''
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const session = getStoredSession();

      if (!session?.token) {
        if (isMounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        return;
      }

      try {
        const response = await authService.me(session.token);

        if (!isMounted) {
          return;
        }

        setAuthSession(session.token, response.data.user);
        dispatch({
          type: 'RESTORE_SESSION_SUCCESS',
          payload: {
            user: response.data.user,
            token: session.token
          }
        });
      } catch (error) {
        clearAuthSession();

        if (isMounted) {
          dispatch({ type: 'AUTH_CLEAR' });
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleUnauthorized = () => {
      clearAuthSession();
      dispatch({ type: 'AUTH_CLEAR' });
    };

    window.addEventListener('smartedu:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('smartedu:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (payload) => {
    const response = await authService.login(payload);

    const authSession = response.data;
    setAuthSession(authSession.token, authSession.user);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: {
        user: authSession.user,
        token: authSession.token
      }
    });

    return authSession;
  };

  const register = async (payload) => {
    const response = await authService.register(payload);

    const authSession = response.data;
    setAuthSession(authSession.token, authSession.user);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: {
        user: authSession.user,
        token: authSession.token
      }
    });

    return authSession;
  };

  const logout = () => {
    clearAuthSession();
    dispatch({ type: 'AUTH_CLEAR' });
  };

  const value = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      loading: state.loading,
      login,
      register,
      logout
    }),
    [state.user, state.token, state.loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
