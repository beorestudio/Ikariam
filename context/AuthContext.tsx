import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface StoredUser extends User {
  password?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for active session on load
  useEffect(() => {
    const storedUser = localStorage.getItem('ikariam_session_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dbUsers: StoredUser[] = JSON.parse(localStorage.getItem('ikariam_db_users') || '[]');
    const foundUser = dbUsers.find((u) => 
      u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (foundUser) {
      // Don't put password in session
      const { password: _, ...sessionUser } = foundUser;
      setUser(sessionUser);
      localStorage.setItem('ikariam_session_user', JSON.stringify(sessionUser));
      return true;
    }
    return false;
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const dbUsers: StoredUser[] = JSON.parse(localStorage.getItem('ikariam_db_users') || '[]');
    
    if (dbUsers.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return false; // User already exists
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
      createdAt: Date.now(),
    };

    const updatedUsers = [...dbUsers, newUser];
    localStorage.setItem('ikariam_db_users', JSON.stringify(updatedUsers));
    
    // Auto login after register (remove password from session)
    const { password: _, ...sessionUser } = newUser;
    setUser(sessionUser);
    localStorage.setItem('ikariam_session_user', JSON.stringify(sessionUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ikariam_session_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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