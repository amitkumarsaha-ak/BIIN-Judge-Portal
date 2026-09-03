import React from 'react';
import {
  ShieldCheck, LayoutDashboard, FolderGit2, DoorOpen,
  Users, CheckSquare, Trophy, History, Sun, Moon, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export type AdminTab =
  | 'dashboard'
  | 'projects'
  | 'rooms'
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

  const navItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'rooms', label: 'Rooms', icon: DoorOpen },
    { id: 'judges', label: 'Judges', icon: Users },
    { id: 'evaluations', label: 'Evaluations', icon: CheckSquare },
    { id: 'results', label: 'Results & Awards', icon: Trophy },
    { id: 'audit', label: 'Audit History', icon: History }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-violet-500 selection:text-white transition-colors duration-200">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          
          {/* Left Brand */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-90 shrink-0"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 p-2 shadow-lg shadow-violet-500/20 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">BIIN</span>
                <span className="rounded-md bg-violet-100 dark:bg-violet-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                  Admin Panel
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">Central Control & Evaluation Management</p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = currentTab === id;
              return (
                <button
                  key={id}
                  id={`admin-nav-${id}`}
                  onClick={() => onSelectTab(id)}
                  className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-violet-600" />
              )}
            </button>

            {/* Admin Badge & Logout */}
            <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-3">
              <div className="hidden sm:flex items-center space-x-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 px-3 py-1.5 border border-violet-200 dark:border-violet-500/30">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold text-violet-900 dark:text-violet-200 leading-tight truncate max-w-[120px]">{currentUser?.fullName || 'Administrator'}</p>
                  <p className="text-[10px] text-violet-600 dark:text-violet-400 font-mono leading-none">Super Admin</p>
                </div>
              </div>

              <button
                id="admin-logout-btn"
                onClick={logout}
                title="Logout from Admin Panel"
                className="flex items-center space-x-1.5 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="flex overflow-x-auto border-t border-slate-200 dark:border-slate-800 px-3 py-2 lg:hidden space-x-1 no-scrollbar text-xs">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => onSelectTab(id)}
                className={`flex items-center space-x-1 rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap ${
                  isActive ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
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
