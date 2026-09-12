import React from 'react';
import {
  Award, LayoutDashboard, FolderGit2, CheckCircle2,
  FileText, Sun, Moon, LogOut
} from 'lucide-react';
import { BiinLogo } from '../common/BiinLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export type JudgeTab = 'dashboard' | 'projects' | 'submissions' | 'report';

interface JudgeLayoutProps {
  currentTab: JudgeTab;
  onSelectTab: (tab: JudgeTab) => void;
  children: React.ReactNode;
}

export const JudgeLayout: React.FC<JudgeLayoutProps> = ({
  currentTab,
  onSelectTab,
  children
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems: { id: JudgeTab; label: string; shortLabel: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', shortLabel: 'Projects', icon: FolderGit2 },
    { id: 'submissions', label: 'My Submissions', shortLabel: 'Submissions', icon: CheckCircle2 },
    { id: 'report', label: 'My Score Summary', shortLabel: 'Score Summary', icon: FileText }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Judge Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors shadow-sm">
        <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
          
          {/* Left Brand */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex cursor-pointer items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90 shrink-0"
          >
            <BiinLogo size="md" />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-heading text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">BIIN</span>
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Judge Portal
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 xl:block">Official Project Evaluation Workspace</p>
            </div>
          </div>

          {/* Center Nav Tabs (Visible on >= md) */}
          <nav className="hidden md:flex items-center space-x-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60 shrink-0">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = currentTab === id;
              return (
                <button
                  key={id}
                  id={`judge-nav-${id}`}
                  onClick={() => onSelectTab(id)}
                  className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
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
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm min-h-[40px] min-w-[40px]"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            {/* Judge Badge & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 dark:border-slate-800 pl-1.5 sm:pl-3">
              <span className="inline-flex items-center space-x-1 sm:space-x-1.5 rounded-xl px-2 sm:px-3 py-1.5 text-xs font-bold border bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30">
                <Award className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline truncate max-w-[120px]">{currentUser?.fullName || 'Judge'}</span>
                <span className="sm:hidden text-[11px]">Judge</span>
              </span>

              {/* Logout */}
              <button
                id="judge-logout-btn"
                onClick={logout}
                title="Logout Session"
                className="flex items-center space-x-1 sm:space-x-1.5 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 px-2.5 sm:px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors min-h-[38px] shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden min-[360px]:inline">Logout</span>
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Nav Row (< md) */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-3 py-2 md:hidden no-scrollbar text-xs backdrop-blur-sm touch-scroll">
          {navItems.map(({ id, shortLabel, icon: Icon }) => {
            const isActive = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => onSelectTab(id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-semibold whitespace-nowrap transition-all shrink-0 min-h-[38px] ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{shortLabel}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>

      {/* Judge Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>BIIN Project Evaluation System · Evaluator Workspace ({currentUser?.fullName})</p>
      </footer>
    </div>
  );
};
