import React, { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, UserCheck, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess: () => void;
  initialRole?: 'judge' | 'admin';
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSuccess,
  initialRole = 'judge'
}) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'judge' | 'admin'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Login failed. Please verify credentials.');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };


  const switchTab = (role: 'judge' | 'admin') => {
    setSelectedRole(role);
    setErrorMessage(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="mx-auto max-w-md w-full">
      <div className="p-1 sm:p-2">
        
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => switchTab('judge')}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedRole === 'judge'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Judge Login</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('admin')}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedRole === 'admin'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl p-2 mb-3 border ${
              selectedRole === 'admin'
                ? 'bg-violet-50 dark:bg-violet-600/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30'
                : 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
            }`}
          >
            {selectedRole === 'admin' ? <ShieldCheck className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
            {selectedRole === 'admin' ? 'Administrator Login' : 'Judge Portal Login'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {selectedRole === 'admin'
              ? 'Sign in to access central management & scoring overrides'
              : 'Sign in with your approved judge account'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 flex items-start space-x-2 rounded-xl bg-red-50 dark:bg-red-500/10 p-3.5 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder={selectedRole === 'admin' ? 'admin@example.com' : 'judge@example.com'}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/90 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg flex items-center justify-center space-x-2 mt-6 transition-all ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            } ${
              selectedRole === 'admin'
                ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/30'
                : 'btn-primary'
            }`}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : selectedRole === 'admin' ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            <span>
              {isLoading
                ? 'Authenticating...'
                : selectedRole === 'admin'
                ? 'Login as Administrator'
                : 'Login to Judge Portal'}
            </span>
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 text-center border-t border-slate-200 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Don't have a judge account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Register Here
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

