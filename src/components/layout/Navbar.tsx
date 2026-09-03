import React from 'react';
import { Award, LogIn, LayoutDashboard, FolderGit2, Sun, Moon, Users, FileText, UserCheck, ShieldCheck } from 'lucide-react';
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

  const allUsers = getUsers();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors duration-200 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Left Side: BIIN Logo & Branding */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-90 shrink-0"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-2 shadow-lg shadow-indigo-500/30">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">BIIN</span>
              <span className="rounded bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                Judging Portal
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Multi-Judge Evaluation Engine</p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectTab('projects')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              currentTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>Select Project</span>
          </button>

          <button
            onClick={() => onSelectTab('combined-results')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              currentTab === 'combined-results'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Combined Results</span>
          </button>

          <button
            onClick={() => onSelectTab('individual-reports')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              currentTab === 'individual-reports'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Individual Reports</span>
          </button>

          <button
            onClick={() => onSelectTab('admin-projects')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              currentTab === 'admin-projects'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Panel</span>
          </button>
        </nav>

        {/* Right Side: Persona Switcher, Theme & Login */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Active Persona Switcher */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
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
            className="flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-200 dark:hover:bg-slate-700/80 shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Login / Auth Modal Trigger */}
          <button
            onClick={onOpenLogin}
            title="Sign in with specific credentials"
            className="btn-primary flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-md"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Login</span>
          </button>
        </div>

      </div>

      {/* Mobile Navigation Row */}
      <div className="flex overflow-x-auto border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-2 py-2 lg:hidden space-x-1 no-scrollbar text-xs">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex items-center space-x-1 rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap ${
            currentTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => onSelectTab('projects')}
          className={`flex items-center space-x-1 rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap ${
            currentTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FolderGit2 className="h-3.5 w-3.5" />
          <span>Projects</span>
        </button>
        <button
          onClick={() => onSelectTab('combined-results')}
          className={`flex items-center space-x-1 rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap ${
            currentTab === 'combined-results' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Combined</span>
        </button>
        <button
          onClick={() => onSelectTab('individual-reports')}
          className={`flex items-center space-x-1 rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap ${
            currentTab === 'individual-reports' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Reports</span>
        </button>
        <button
          onClick={() => onSelectTab('admin-projects')}
          className={`flex items-center space-x-1 rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap ${
            currentTab === 'admin-projects' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
};


