import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearError } from '../store/slices/authSlice';
import { Tv, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 font-sans text-slate-100 antialiased overflow-hidden">
      {/* Background Animated Gradient Orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-rose-600/20 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"></div>

      <div className="z-10 w-full max-w-md space-y-6">
        {/* Logo and Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 shadow-xl shadow-rose-900/40">
            <Tv className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">StreamESPN Admin</h1>
          <p className="text-xs text-slate-400">Sign in to manage live streams, users & settings</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) dispatch(clearError());
                  }}
                  placeholder="admin@example.com"
                  required
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 transition-all focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) dispatch(clearError());
                  }}
                  placeholder="••••••••"
                  required
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 transition-all focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:from-rose-500 hover:to-rose-400 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <span>Sign In to Admin Panel</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
