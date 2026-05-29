import React, { createContext, useState, useCallback, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  userId: string | null;
  token: string | null;
  login: (token: string, email: string, userId: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedEmail = localStorage.getItem('userEmail');
    const savedUserId = localStorage.getItem('userId');

    if (savedToken && savedEmail && savedUserId) {
      setToken(savedToken);
      setUserEmail(savedEmail);
      setUserId(savedUserId);
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback((newToken: string, email: string, userId: string) => {
    setToken(newToken);
    setUserEmail(email);
    setUserId(userId);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', userId);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserEmail(null);
    setUserId(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userId, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
