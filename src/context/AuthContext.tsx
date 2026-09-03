import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getCurrentUser, setCurrentUserSession, findUserByEmail, saveUser } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  register: (fullName: string, email: string, pass: string, confirmPass: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return getCurrentUser();
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const login = (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    if (!trimmedEmail || !cleanPass) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    const existingUser = findUserByEmail(trimmedEmail);
    if (!existingUser) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (existingUser.password !== pass && existingUser.password !== cleanPass) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Success
    setCurrentUser(existingUser);
    setCurrentUserSession(existingUser);
    return { success: true };
  };

  const register = (fullName: string, email: string, pass: string, confirmPass: string) => {
    const nameTrimmed = fullName.trim();
    const emailTrimmed = email.trim().toLowerCase();

    if (!nameTrimmed) {
      return { success: false, error: 'Full name is required.' };
    }

    if (!emailTrimmed) {
      return { success: false, error: 'Valid email address is required.' };
    }

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!pass || pass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    if (pass !== confirmPass) {
      return { success: false, error: 'Passwords do not match.' };
    }

    const existingUser = findUserByEmail(emailTrimmed);
    if (existingUser) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newUser: User = {
      id: `judge-${Date.now()}`,
      fullName: nameTrimmed,
      email: emailTrimmed,
      password: pass,
      role: 'judge',
      createdAt: new Date().toISOString(),
      roomNumber: 'Room 01'
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    setCurrentUserSession(newUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentUserSession(null);
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setCurrentUserSession(user);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, login, register, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
