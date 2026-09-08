import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getCurrentUser, setCurrentUserSession, findUserByEmail, saveUser } from '../services/storage';
import { ADMIN_CONFIG } from '../config/authConfig';

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
      // Validate session: If session claims to be admin, verify email
      if (user.role === 'admin' && user.email?.trim().toLowerCase() !== ADMIN_CONFIG.EMAIL.trim().toLowerCase()) {
        setCurrentUser(null);
        setCurrentUserSession(null);
        return;
      }
      // If judge session is pending or rejected, invalidate session
      if (user.role === 'judge') {
        const freshUser = findUserByEmail(user.email);
        if (!freshUser || freshUser.status !== 'approved') {
          setCurrentUser(null);
          setCurrentUserSession(null);
          return;
        }
      }
      setCurrentUser(user);
    }
  }, []);

  const login = (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    if (!trimmedEmail || !cleanPass) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    // 1. Single Fixed Admin Authentication
    if (trimmedEmail === ADMIN_CONFIG.EMAIL.trim().toLowerCase()) {
      if (cleanPass !== ADMIN_CONFIG.PASSWORD && pass !== ADMIN_CONFIG.PASSWORD) {
        return { success: false, error: 'Invalid admin email or password.' };
      }
      const adminUser: User = {
        id: 'admin-fixed-1',
        fullName: ADMIN_CONFIG.NAME,
        email: ADMIN_CONFIG.EMAIL,
        role: 'admin',
        status: 'approved',
        createdAt: '2026-07-01T08:00:00Z'
      };
      setCurrentUser(adminUser);
      setCurrentUserSession(adminUser);
      return { success: true };
    }

    // 2. Judge Authentication
    const existingUser = findUserByEmail(trimmedEmail);
    if (!existingUser) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (existingUser.password !== pass && existingUser.password !== cleanPass) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // A non-admin cannot authenticate as admin
    if (existingUser.role === 'admin') {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Judge Status Access Checks
    if (existingUser.status === 'pending') {
      return {
        success: false,
        error: 'Your account is currently pending Administrator approval. Please wait for an Admin to approve your registration before logging in.'
      };
    }

    if (existingUser.status === 'rejected') {
      return {
        success: false,
        error: 'Your judge registration has been declined by the Administrator. Access is denied.'
      };
    }

    // Approved judge login
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

    // Reserve admin email from registration
    if (emailTrimmed === ADMIN_CONFIG.EMAIL.trim().toLowerCase()) {
      return { success: false, error: 'This email address is reserved by the system and cannot be registered.' };
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

    // New judge registration: strictly role 'judge', status 'pending'
    const newUser: User = {
      id: `judge-${Date.now()}`,
      fullName: nameTrimmed,
      email: emailTrimmed,
      password: pass,
      role: 'judge',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    saveUser(newUser);
    // DO NOT automatically log in pending judges
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentUserSession(null);
  };

  const switchUser = (user: User) => {
    // Only allow switching to valid users
    if (user.role === 'admin' && user.email?.trim().toLowerCase() !== ADMIN_CONFIG.EMAIL.trim().toLowerCase()) {
      return;
    }
    if (user.role === 'judge' && user.status !== 'approved') {
      return;
    }
    setCurrentUser(user);
    setCurrentUserSession(user);
  };

  const isAdmin = currentUser?.role === 'admin' && currentUser?.email?.trim().toLowerCase() === ADMIN_CONFIG.EMAIL.trim().toLowerCase();

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
