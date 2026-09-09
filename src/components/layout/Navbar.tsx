import React, { useState } from 'react';
import {
  LogIn, LayoutDashboard, FolderGit2, Sun, Moon,
  Users, FileText, UserCheck, ShieldCheck, Menu, X
} from 'lucide-react';
import { BiinLogo } from '../common/BiinLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUsers } from '../../services/storage';

export type NavTab = 'dashboard' | 'projects' | 'combined-results' | 'individual-reports' | 'admin-projects';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenLogin }) => {
  const { currentUser, isAdmin, switchUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allUsers = getUsers();

  const navLinks = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as NavTab, label: 'Projects', icon: FolderGit2 },
    { id: 'combined-results' as NavTab, label: 'Combined Results', icon: Users },
    { id: 'individual-reports' as NavTab, label: 'Individual Reports', icon: FileText },
    { id: 'admin-projects' as NavTab, label: 'Admin Panel', icon: ShieldCheck, adminOnly: true }
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors duration-200 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        
        {/* Left Side: BIIN Logo & Branding */}
        <div 
          onClick={() => handleTabClick('dashboard')} 
          className="flex cursor-pointer items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90 shrink-0"
        >
          <BiinLogo size="md" />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-heading text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">BIIN</span>
              <span className="rounded bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                Judging Portal
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 xl:block">Multi-Judge Evaluation Engine</p>
          </div>
        </div>

        {/* Center Desktop Navigation Links (>= lg) */}
        <nav className="hidden lg:flex items-center space-x-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60 shrink-0">
          {navLinks.map(({ id, label, icon: Icon, adminOnly }) => {
            const isActive = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => onSelectTab(id)}
                className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? adminOnly
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : adminOnly
                      ? 'text-slate-600 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side: Persona Switcher, Theme & Login */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Active Persona Switcher (hidden on mobile, inside drawer on mobile) */}
          <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
            {isAdmin ? (
              <ShieldCheck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
            ) : (
              <UserCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            )}
            <select
              value={currentUser?.email || ''}
              onChange={(e) => {
                const found = allUsers.find((u) => u.email.toLowerCase() === e.target.value.toLowerCase());
                if (found) {
                  switchUser(found);
                }
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              title="Switch active user or administrator"
            >
              <optgroup label="Administrators">
                {allUsers.filter(u => u.role === 'admin').map((u) => (
                  <option key={u.email} value={u.email} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    👑 {u.fullName} (Super Admin)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Judges">
                {allUsers.filter(u => u.role === 'judge').map((j) => (
                  <option key={j.email} value={j.email} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    ⚖️ {j.fullName} ({j.roomNumber || 'Room 01'})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark and Light Mode"
            className="flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-200 dark:hover:bg-slate-700/80 shadow-sm min-h-[40px] min-w-[40px]"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
          </button>

          {/* Login / Auth Modal Trigger */}
          <button
            onClick={onOpenLogin}
            title="Sign in with specific credentials"
            className="btn-primary flex items-center space-x-1.5 rounded-xl px-3 sm:px-3.5 py-2 text-xs font-bold text-white shadow-md min-h-[40px]"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Login</span>
          </button>

          {/* Mobile Hamburger Menu Button (lg:hidden) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open mobile navigation menu"
            className="lg:hidden flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[40px] min-w-[40px]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Slide-Down Drawer (< lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* Mobile Persona Switcher */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active User Profile</p>
            <div className="flex items-center space-x-2">
              {isAdmin ? (
                <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
              ) : (
                <UserCheck className="h-4 w-4 text-indigo-500 shrink-0" />
              )}
              <select
                value={currentUser?.email || ''}
                onChange={(e) => {
                  const found = allUsers.find((u) => u.email.toLowerCase() === e.target.value.toLowerCase());
                  if (found) {
                    switchUser(found);
                  }
                }}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <optgroup label="Administrators">
                  {allUsers.filter(u => u.role === 'admin').map((u) => (
                    <option key={u.email} value={u.email} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      👑 {u.fullName} (Super Admin)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Judges">
                  {allUsers.filter(u => u.role === 'judge').map((j) => (
                    <option key={j.email} value={j.email} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      ⚖️ {j.fullName} ({j.roomNumber || 'Room 01'})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Navigation Links List */}
          <div className="space-y-1.5">
            {navLinks.map(({ id, label, icon: Icon, adminOnly }) => {
              const isActive = currentTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all min-h-[44px] ${
                    isActive
                      ? adminOnly
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Swipeable Quick Tab Bar on Tablet / Mobile (< lg) */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-2.5 py-2 lg:hidden no-scrollbar text-xs backdrop-blur-sm touch-scroll">
        {navLinks.map(({ id, label, icon: Icon, adminOnly }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold whitespace-nowrap transition-all shrink-0 min-h-[38px] ${
                isActive
                  ? adminOnly
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30 font-bold'
                    : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};



