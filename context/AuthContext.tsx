import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { mockLogin } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 hours

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mastry_current_user');
  }, []);

  const checkActivity = useCallback(() => {
    if (user && Date.now() - lastActivity > INACTIVITY_LIMIT) {
      logout();
    }
  }, [user, lastActivity, logout]);

  useEffect(() => {
    const storedUser = localStorage.getItem('mastry_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateActivity = () => setLastActivity(Date.now());

    events.forEach(event => window.addEventListener(event, updateActivity));
    
    // Check inactivity every minute
    const interval = setInterval(checkActivity, 60000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(interval);
    };
  }, [checkActivity]);

  const login = async (email: string, password: string) => {
    const user = await mockLogin(email, password);
    if (user) {
      setUser(user);
      localStorage.setItem('mastry_current_user', JSON.stringify(user));
      setLastActivity(Date.now());
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
