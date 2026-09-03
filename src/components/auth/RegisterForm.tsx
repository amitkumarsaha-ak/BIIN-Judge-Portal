import React, { useState } from 'react';
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = register(fullName, email, password, confirmPassword);
    if (!result.success) {
      setErrorMessage(result.error || 'Registration failed.');
    } else {
      onSuccess();
    }
  };

  return (
    <div className="mx-auto max-w-md w-full">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-700/60">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600/20 text-cyan-400 mb-3 border border-cyan-500/30">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-white">Judge Registration</h2>
          <p className="text-sm text-slate-400 mt-1">Create an account to participate as a BIIN Project Judge</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 flex items-start space-x-2 rounded-xl bg-red-500/10 p-3.5 text-sm text-red-300 border border-red-500/30">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
                className="w-full rounded-xl bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
                className="w-full rounded-xl bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
                className="w-full rounded-xl bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
                className="w-full rounded-xl bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-cyan-500 hover:to-indigo-500 flex items-center justify-center space-x-2 mt-6 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Complete Registration</span>
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 text-center border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              Sign In Here
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
