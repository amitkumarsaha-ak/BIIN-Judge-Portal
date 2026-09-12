import React, { useState } from 'react';
import { KeyRound, Mail, Lock, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordFormProps {
  onSwitchToLogin: (email?: string) => void;
  initialEmail?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSwitchToLogin,
  initialEmail = ''
}) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await resetPassword(email, newPassword, confirmPassword);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to reset password.');
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full">
      <div className="p-1 sm:p-2">

        {isSuccess ? (
          /* Password Reset Success State */
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Password Updated!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Your judge account password has been successfully reset.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 text-xs text-left space-y-1.5">
              <p className="text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed text-[12px]">
                You can now sign in using your email <strong className="text-slate-900 dark:text-white font-mono">{email}</strong> and your new password.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onSwitchToLogin(email)}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 py-3 text-sm font-semibold text-white shadow-lg flex items-center justify-center space-x-2 transition-all min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Proceed to Login</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 mb-3 border border-amber-200 dark:border-amber-500/30">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your judge email and choose a new password
              </p>
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
                  Registered Judge Email
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
                    placeholder="judge@university.edu"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-slate-100 dark:bg-slate-800/50 p-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Admin passwords cannot be changed here. Only registered and active judge accounts can update their login password.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg flex items-center justify-center space-x-2 mt-4 transition-all min-h-[44px] ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                <span>{isLoading ? 'Updating Password...' : 'Reset & Save Password'}</span>
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center border-t border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => onSwitchToLogin(email)}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Remembered your password? Back to Login</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
