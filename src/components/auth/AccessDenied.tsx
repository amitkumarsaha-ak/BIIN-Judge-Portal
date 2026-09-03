import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedProps {
  requiredRole?: string;
  onGoBack?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole = 'Administrator',
  onGoBack
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 p-8 shadow-2xl text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-500/10 px-3 py-1 text-xs font-mono font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            HTTP 403 · FORBIDDEN ACCESS
          </span>
          <h2 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
            Access Denied
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            You do not have permission to view this section. This area requires <strong>{requiredRole}</strong> privileges.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-3.5 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
          Current User: <strong className="text-slate-900 dark:text-white">{currentUser?.fullName}</strong> ({currentUser?.email})
          <br />
          Current Role: <span className="uppercase font-mono font-bold text-indigo-600 dark:text-indigo-400">{currentUser?.role}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </button>
          )}

          <button
            onClick={logout}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
