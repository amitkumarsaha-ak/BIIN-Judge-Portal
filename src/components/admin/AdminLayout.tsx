import React from 'react';
import {
  LayoutDashboard, FolderGit2,
  Users, CheckSquare, Trophy, History, Sun, Moon, LogOut, ShieldCheck
} from 'lucide-react';
import { BiinLogo } from '../common/BiinLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export type AdminTab =
  | 'dashboard'
  | 'projects'
  | 'judges'
  | 'evaluations'
  | 'results'
  | 'audit';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  children
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems: {
    id: AdminTab;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', shortLabel: 'Projects', icon: FolderGit2 },
    { id: 'judges', label: 'Judge Approvals', shortLabel: 'Judges', icon: Users },
    { id: 'evaluations', label: 'Evaluations', shortLabel: 'Evaluations', icon: CheckSquare },
    { id: 'results', label: 'Results & Awards', shortLabel: 'Results', icon: Trophy },
    { id: 'audit', label: 'Audit History', shortLabel: 'Audit', icon: History }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-violet-500 selection:text-white transition-colors duration-200">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors shadow-sm">
        <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-2 sm:gap-3 lg:gap-6 px-3 py-2.5 sm:px-6 lg:px-8 sm:py-3.5">
          
          {/* Left Brand */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex cursor-pointer items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90 shrink-0"
          >
            <BiinLogo size="md" />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-heading text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">BIIN</span>
                <span className="rounded-md bg-violet-100 dark:bg-violet-500/20 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                  Admin Panel
                </span>
              </div>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 2xl:block">Central Control & Evaluation Management</p>
            </div>
          </div>

          {/* Desktop Nav Tabs - Single Bar with Full Height */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 p-1.5 border border-slate-200/80 dark:border-slate-700/70 shadow-inner shrink-0">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = currentTab === id;
              return (
                <button
                  key={id}
                  id={`admin-nav-${id}`}
                  onClick={() => onSelectTab(id)}
                  className={`flex items-center gap-1.5 lg:gap-2 rounded-xl px-3 lg:px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/70 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls - Fully locked on full-screen */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-violet-600" />
              )}
            </button>

            {/* Admin Badge */}
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 px-3 py-1.5 border border-violet-200 dark:border-violet-500/30 shrink-0">
              <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-violet-900 dark:text-violet-200 leading-tight truncate max-w-[120px]">
                  {currentUser?.fullName || 'Administrator'}
                </p>
                <p className="text-[10px] text-violet-600 dark:text-violet-400 font-mono leading-none">Super Admin</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="admin-logout-btn"
              onClick={logout}
              title="Logout from Admin Panel"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 sm:px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shrink-0 shadow-xs min-h-[38px]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">Logout</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Scrollbar (Only on small mobile phones < 768px) */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 px-4 py-2 md:hidden no-scrollbar text-xs backdrop-blur-sm">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => onSelectTab(id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>BIIN Judging & Nomination Platform · Administrator Control Center</p>
      </footer>
    </div>
  );
};
