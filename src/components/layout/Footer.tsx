import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 text-slate-600 dark:text-slate-400 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-slate-900 dark:text-white">BIIN Project Judging Portal</span>
              <p className="text-xs text-slate-500">Official Evaluation Engine • Version 2.5.0</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Strict 50-Mark Standard</span>
            </div>
            <span>•</span>
            <span>Real-time Scoring</span>
            <span>•</span>
            <span>Encrypted Audit Log</span>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} BIIN Awards Committee. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
};
