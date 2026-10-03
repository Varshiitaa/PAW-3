import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const getApiUrls = (endpoint) => {
  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost';
  const primary = `http://${host}:8000${endpoint}`;
  const secondary = host === '127.0.0.1' 
    ? `http://localhost:8000${endpoint}` 
    : `http://127.0.0.1:8000${endpoint}`;
  return [primary, secondary];
};

const resilientFetch = async (endpoint, options = {}) => {
  const [primaryUrl, secondaryUrl] = getApiUrls(endpoint);
  try {
    return await fetch(primaryUrl, options);
  } catch (err) {
    console.warn(`Primary fetch failed (${primaryUrl}), trying fallback (${secondaryUrl})...`, err);
    return await fetch(secondaryUrl, options);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('streetpaw_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchMe = async (authToken) => {
    try {
      const res = await resilientFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (e) {
      console.error('Fetch me auth error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (usernameOrEmail, password) => {
    const cleanIdentifier = (usernameOrEmail || '').trim();
    const res = await resilientFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email: cleanIdentifier, password })
    });
    const data = await res.json();
    if (!res.ok) {
      const errDetail = typeof data.detail === 'string'
        ? data.detail
        : (Array.isArray(data.detail) ? data.detail[0]?.msg : 'Login failed');
      throw new Error(errDetail || 'Login failed');
    }

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('streetpaw_token', data.access_token);
    return data.user;
  };

  const signup = async (signupData) => {
    const cleanData = {
      ...signupData,
      email: (signupData.email || '').trim(),
      username: (signupData.username || '').trim(),
    };
    const res = await resilientFetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanData)
    });
    const data = await res.json();
    if (!res.ok) {
      const errDetail = typeof data.detail === 'string'
        ? data.detail
        : (Array.isArray(data.detail) ? data.detail[0]?.msg : 'Signup failed');
      throw new Error(errDetail || 'Signup failed');
    }

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('streetpaw_token', data.access_token);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('streetpaw_token');
    resilientFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isGuest: !user, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
