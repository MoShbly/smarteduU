const TOKEN_KEY = 'smart_classroom_token';
const USER_KEY = 'smart_classroom_user';
const ROLE_COOKIE_KEY = 'smart_classroom_role';
const COOKIE_DURATION = 60 * 60 * 24 * 7;

const setCookie = (name, value) => {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_DURATION}; samesite=lax${secure}`;
};

const clearCookie = (name) => {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};

export const setAuthSession = (token, user) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setCookie(TOKEN_KEY, token);
  setCookie(ROLE_COOKIE_KEY, user.role);
};

export const getStoredSession = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);

  if (!token || !user) {
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(user)
    };
  } catch (error) {
    clearAuthSession();
    return null;
  }
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearCookie(TOKEN_KEY);
  clearCookie(ROLE_COOKIE_KEY);
};
