import React, { useState } from 'react';
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle, Clock, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await register(fullName, email, password, confirmPassword);
      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed.');
      } else {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('biin_users_updated'));
        }
        setIsSubmitted(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full">
      <div className="p-1 sm:p-2">
        
        {isSubmitted ? (
          /* Submission Pending Approval Confirmation State */
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <CheckCircle className="h-8 w-8" />
            </div>
            
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Registration Submitted!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Your judge account has been successfully created.</p>
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 text-xs text-left space-y-1.5">
              <div className="flex items-center space-x-2 font-semibold text-amber-800 dark:text-amber-300">
                <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Status: Pending Administrator Approval</span>
              </div>
              <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed text-[11px]">
                Registration for <strong className="text-slate-900 dark:text-white font-mono">{email}</strong> is now awaiting review. You will be able to log in to the Judge Portal once an Administrator approves your account.
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              If an Administrator has not approved your account yet, login attempts will remain on hold.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-sm font-semibold text-white shadow-lg flex items-center justify-center space-x-2 transition-all min-h-[44px]"
              >
                <LogIn className="h-4 w-4" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 mb-3 border border-cyan-200 dark:border-cyan-500/30">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Judge Registration</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create an account to participate as a BIIN Project Judge</p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-5 flex items-start space-x-2 rounded-xl bg-red-50 dark:bg-red-500/10 p-3.5 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Michael Chang"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m.chang@university.edu"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-cyan-500 hover:to-indigo-500 flex items-center justify-center space-x-2 mt-6 transition-all min-h-[44px] ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
              </button>
            </form>

            {/* Footer Toggle */}
            <div className="mt-6 text-center border-t border-slate-200 dark:border-slate-800 pt-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  Sign In Here
                </button>
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

