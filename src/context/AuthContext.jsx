import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('stockchat-user');
      if (saved) setUser(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const login = useCallback((googleUser) => {
    const profile = {
      name: googleUser.name,
      email: googleUser.email,
      picture: googleUser.picture,
      sub: googleUser.sub,
    };
    setUser(profile);
    localStorage.setItem('stockchat-user', JSON.stringify(profile));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('stockchat-user');
    localStorage.removeItem('stockchat-ai-chats');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}