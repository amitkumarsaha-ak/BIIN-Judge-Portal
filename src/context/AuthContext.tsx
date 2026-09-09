import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getCurrentUser, setCurrentUserSession, findUserByEmail, saveUser, getUsers } from '../services/storage';
import { ADMIN_CONFIG } from '../config/authConfig';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, pass: string, confirmPass: string) => Promise<{ success: boolean; error?: string }>;
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
        if (freshUser && freshUser.status !== 'approved') {
          setCurrentUser(null);
          setCurrentUserSession(null);
          return;
        }
        // Async verify status with backend
        api.getMe(user.email).then(remoteUser => {
          if (remoteUser && remoteUser.status !== 'approved') {
            setCurrentUser(null);
            setCurrentUserSession(null);
          }
        }).catch(() => {});
      }
      setCurrentUser(user);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
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
      api.login(trimmedEmail, pass).catch(() => {});
      return { success: true };
    }

    // 2. Judge Authentication - Attempt backend API first
    try {
      const response = await api.login(trimmedEmail, cleanPass);
      if (response && response.success && response.user) {
        const loggedJudge: User = {
          ...response.user,
          password: cleanPass // cache password locally for seamless offline capability
        };

        // Update local storage so cache is synced
        const users = getUsers();
        const idx = users.findIndex(u => u.email?.toLowerCase() === trimmedEmail || u.id === loggedJudge.id);
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...loggedJudge };
        } else {
          users.push(loggedJudge);
        }
        localStorage.setItem('biin_judge_portal_users', JSON.stringify(users));

        setCurrentUser(loggedJudge);
        setCurrentUserSession(loggedJudge);
        return { success: true };
      }
    } catch (apiErr: any) {
      const errMsg = apiErr?.message || '';
      // If server returned an explicit auth error, bubble it up directly to user
      const isExplicitAuthError = 
        errMsg.includes('Invalid') ||
        errMsg.includes('password') ||
        errMsg.includes('approval') ||
        errMsg.includes('pending') ||
        errMsg.includes('rejected') ||
        errMsg.includes('No user account found') ||
        errMsg.includes('reserved');

      if (isExplicitAuthError) {
        return { success: false, error: errMsg };
      }
      // If network / server error, fallback to offline localStorage verification below
    }

    // 3. Offline LocalStorage Fallback
    const existingUser = findUserByEmail(trimmedEmail);
    if (!existingUser) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // If local record doesn't have a cached password (synced without password), server must be reached
    if (!existingUser.password) {
      return { success: false, error: 'Unable to connect to server. Please check your network connection and try again.' };
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

  const register = async (fullName: string, email: string, pass: string, confirmPass: string): Promise<{ success: boolean; error?: string }> => {
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

    // Attempt backend registration
    let remoteUserId: string | undefined;
    try {
      const regRes = await api.register(nameTrimmed, emailTrimmed, pass);
      if (regRes?.user?.id) {
        remoteUserId = regRes.user.id;
      }
    } catch (apiErr: any) {
      const errMsg = apiErr?.message || '';
      if (errMsg.includes('already exists') || errMsg.includes('reserved')) {
        return { success: false, error: errMsg };
      }
      // Continue locally even if server is offline
    }

    // Save locally
    const newUser: User = {
      id: remoteUserId || `judge-${Date.now()}`,
      fullName: nameTrimmed,
      email: emailTrimmed,
      password: pass,
      role: 'judge',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    saveUser(newUser);
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
