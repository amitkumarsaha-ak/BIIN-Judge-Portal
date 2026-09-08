import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AccessDenied } from './components/auth/AccessDenied';

// Admin Suite Components
import { AdminLayout, type AdminTab } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProjectsView } from './components/admin/AdminProjectsView';
import { AdminJudgesView } from './components/admin/AdminJudgesView';
import { AdminEvaluationsView } from './components/admin/AdminEvaluationsView';
import { AdminResultsView } from './components/admin/AdminResultsView';
import { AdminAuditView } from './components/admin/AdminAuditView';

// Judge Suite Components
import { JudgeLayout, type JudgeTab } from './components/judge/JudgeLayout';
import { JudgeDashboardView } from './components/judge/JudgeDashboardView';
import { JudgeProjectsView } from './components/judge/JudgeProjectsView';
import { JudgeEvaluationsView } from './components/judge/JudgeEvaluationsView';
import { JudgeOwnReportView } from './components/judge/JudgeOwnReportView';
import { ProjectEvaluationView } from './components/evaluation/ProjectEvaluationView';

import type { Project } from './types';
import { ArrowRight, Sparkles, Award, Sun, Moon, LogIn, ShieldCheck } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [judgeTab, setJudgeTab] = useState<JudgeTab>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Auth Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginRole, setLoginRole] = useState<'judge' | 'admin'>('judge');

  // URL Hash Synchronizer & Role Protection
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash) return;

      if (hash.startsWith('admin/')) {
        const tab = hash.replace('admin/', '') as AdminTab;
        if (['dashboard', 'projects', 'judges', 'evaluations', 'results', 'audit'].includes(tab)) {
          setAdminTab(tab);
        }
      } else if (hash.startsWith('judge/')) {
        const tab = hash.replace('judge/', '') as JudgeTab;
        if (['dashboard', 'projects', 'submissions', 'report'].includes(tab)) {
          setJudgeTab(tab);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync hash on user login / role switch
  useEffect(() => {
    if (!currentUser) {
      if (window.location.hash.startsWith('#admin/') || window.location.hash.startsWith('#judge/')) {
        window.location.hash = '';
      }
      return;
    }

    const currentHash = window.location.hash.replace(/^#\/?/, '');
    if (isAdmin) {
      if (!currentHash.startsWith('admin/')) {
        window.location.hash = `#admin/${adminTab}`;
      }
    } else if (currentUser.role === 'judge') {
      if (!currentHash.startsWith('judge/')) {
        window.location.hash = `#judge/${judgeTab}`;
      }
    }
  }, [currentUser, isAdmin, adminTab, judgeTab]);

  const handleSelectAdminTab = (tab: AdminTab) => {
    setAdminTab(tab);
    window.location.hash = `#admin/${tab}`;
  };

  const handleSelectJudgeTab = (tab: JudgeTab) => {
    setSelectedProject(null);
    setJudgeTab(tab);
    window.location.hash = `#judge/${tab}`;
  };

  const handleOpenLogin = (role: 'judge' | 'admin' = 'judge') => {
    setLoginRole(role);
    setAuthMode('login');
    setIsLoginModalOpen(true);
  };

  // --- 1. LOGGED-OUT PUBLIC LANDING PAGE ---
  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
        
        {/* Landing Topbar */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-2 shadow-lg shadow-indigo-500/30 text-white">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-heading text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">BIIN</span>
                  <span className="rounded bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    Evaluation System
                  </span>
                </div>
                <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Role-Based Judging & Administration</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
              </button>

              <button
                id="admin-login-nav-btn"
                onClick={() => handleOpenLogin('admin')}
                className="hidden sm:flex items-center space-x-1.5 rounded-xl border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/50 px-3.5 py-2 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors shadow-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Login</span>
              </button>

              <button
                id="judge-login-nav-btn"
                onClick={() => handleOpenLogin('judge')}
                className="btn-primary flex items-center space-x-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg"
              >
                <LogIn className="h-4 w-4" />
                <span>Judge Login</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero & Content */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 sm:p-14 border border-slate-200 dark:border-slate-800 shadow-2xl text-center text-white">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-5">
              <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-300 border border-indigo-400/30">
                <Sparkles className="h-4 w-4" />
                <span>BIIN Role-Based Access Engine</span>
              </div>

              <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl tracking-tight leading-tight">
                Project Evaluation & Central Administration
              </h1>

              <p className="text-sm text-slate-200 sm:text-base max-w-2xl mx-auto leading-relaxed">
                Dedicated Admin Control Center and Isolated Judge Workspace with strict role permissions, room scoping, evaluation lock engines, and official report sheets.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  id="hero-judge-login-btn"
                  onClick={() => handleOpenLogin('judge')}
                  className="btn-primary w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-xl hover:scale-105 transition-transform"
                >
                  <span>Judge Panel Login</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  id="hero-admin-login-btn"
                  onClick={() => handleOpenLogin('admin')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl bg-violet-600/30 hover:bg-violet-600/40 px-8 py-3.5 text-sm font-semibold text-white transition-colors border border-violet-400/30 shadow-lg"
                >
                  <ShieldCheck className="h-4 w-4 text-violet-300" />
                  <span>Admin Panel Login</span>
                </button>

                <button
                  onClick={() => {
                    setAuthMode('register');
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl bg-white/10 dark:bg-slate-800/90 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors border border-white/20 dark:border-slate-700"
                >
                  <span>Register Judge</span>
                </button>
              </div>
            </div>
          </div>

          {/* Workflow Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
            {/* Admin Panel Card */}
            <div
              id="admin-workspace-card"
              onClick={() => handleOpenLogin('admin')}
              className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-4 cursor-pointer hover:border-violet-400/50 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:underline flex items-center space-x-1">
                  <span>Sign In as Admin</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Central Admin Panel</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Full administrative authority over project nominations, category classifications, judge registration approvals, evaluations, rankings, lock engines, and audit logs.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">Projects & Categories</span>
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">Judge Approvals</span>
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">Evaluation Locks</span>
              </div>
            </div>

            {/* Judge Workspace Card */}
            <div
              id="judge-workspace-card"
              onClick={() => handleOpenLogin('judge')}
              className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-4 cursor-pointer hover:border-indigo-400/50 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold group-hover:scale-110 transition-transform">
                  <Award className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center space-x-1">
                  <span>Sign In as Judge</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Isolated Judge Workspace</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Judges only evaluate projects assigned strictly to their room arena. Other judge scores and admin controls remain protected and inaccessible.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">Room-Isolated Queue</span>
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">100-Point Scorer</span>
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">Personal Submissions</span>
              </div>
            </div>

          </div>
        </main>

        {/* Auth Modal Container */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute -top-10 right-0 text-slate-300 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80"
              >
                ✕ Close
              </button>

              {authMode === 'login' ? (
                <LoginForm
                  initialRole={loginRole}
                  onSwitchToRegister={() => setAuthMode('register')}
                  onSuccess={() => setIsLoginModalOpen(false)}
                />
              ) : (
                <RegisterForm
                  onSwitchToLogin={() => {
                    setLoginRole('judge');
                    setAuthMode('login');
                  }}
                  onSuccess={() => setIsLoginModalOpen(false)}
                />
              )}
            </div>
          </div>
        )}

        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
          <p>© 2026 BIIN Evaluation System · Official Multi-Judge & Administration Portal</p>
        </footer>
      </div>
    );
  }

  // --- 2. ADMIN PANEL (Strictly role === 'admin') ---
  if (isAdmin) {
    // If Admin attempts to view a Judge route, normalize to admin dashboard
    const currentHash = window.location.hash.replace(/^#\/?/, '');
    if (currentHash.startsWith('judge/')) {
      window.location.hash = `#admin/${adminTab}`;
    }

    return (
      <AdminLayout currentTab={adminTab} onSelectTab={handleSelectAdminTab}>
        {adminTab === 'dashboard' && (
          <AdminDashboard
            onNavigate={handleSelectAdminTab}
            onOpenAddProject={() => handleSelectAdminTab('projects')}
            onOpenAddJudge={() => handleSelectAdminTab('judges')}
          />
        )}
        {adminTab === 'projects' && <AdminProjectsView />}
        {adminTab === 'judges' && <AdminJudgesView />}
        {adminTab === 'evaluations' && <AdminEvaluationsView />}
        {adminTab === 'results' && <AdminResultsView />}
        {adminTab === 'audit' && <AdminAuditView />}
      </AdminLayout>
    );
  }

  // --- 3. JUDGE PANEL (Strictly role === 'judge') ---
  if (currentUser.role === 'judge') {
    // Security check: If Judge attempts to view an Admin route, deny access
    const currentHash = window.location.hash.replace(/^#\/?/, '');
    if (currentHash.startsWith('admin/')) {
      return (
        <AccessDenied
          requiredRole="Administrator"
          onGoBack={() => {
            window.location.hash = '#judge/dashboard';
            setJudgeTab('dashboard');
          }}
        />
      );
    }

    // If Judge is scoring a project
    if (selectedProject) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8">
          <div className="mx-auto max-w-5xl">
            <ProjectEvaluationView
              project={selectedProject}
              onBack={() => setSelectedProject(null)}
              onGoToDashboard={() => {
                setSelectedProject(null);
                setJudgeTab('dashboard');
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <JudgeLayout currentTab={judgeTab} onSelectTab={handleSelectJudgeTab}>
        {judgeTab === 'dashboard' && (
          <JudgeDashboardView
            onNavigate={handleSelectJudgeTab}
            onSelectProjectForEvaluation={(proj) => setSelectedProject(proj)}
          />
        )}
        {judgeTab === 'projects' && (
          <JudgeProjectsView
            onSelectProjectForEvaluation={(proj) => setSelectedProject(proj)}
          />
        )}
        {judgeTab === 'submissions' && (
          <JudgeEvaluationsView
            onSelectProjectForEvaluation={(proj) => setSelectedProject(proj)}
          />
        )}
        {judgeTab === 'report' && <JudgeOwnReportView />}
      </JudgeLayout>
    );
  }

  // Fallback 403 Forbidden Access for unrecognized roles
  return <AccessDenied onGoBack={() => window.location.reload()} />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;




