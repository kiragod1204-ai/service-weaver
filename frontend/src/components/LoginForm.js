import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  
  const store = useStore();
  const login = store?.login;
  const register = store?.register;
  const isLoading = store?.isLoading;
  const error = store?.error;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        await login({ username, password });
      } else {
        await register({ username, password, email, role });
      }
    } catch (err) {
      // Error is handled by the store
      console.error('Authentication error:', err);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Clear form fields when switching modes
    setUsername('');
    setPassword('');
    setEmail('');
  };

  return (
    <div className="bg-dark-800/90 backdrop-blur-glass border border-neon-green/30 rounded-2xl p-8 w-96 shadow-glass-strong relative overflow-hidden animate-scale-in">
      {/* Animated border glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 via-neon-blue/20 to-neon-purple/20 rounded-2xl blur-sm animate-gradient-shift bg-[length:200%_200%]"></div>
      
      <div className="relative z-10">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dark-700/80 border border-neon-green/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green focus:shadow-neon-green/50 transition-all duration-300"
              required
              disabled={isLoading}
            />
          </div>

          {/* Email field (only for registration) */}
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-700/80 border border-neon-green/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green focus:shadow-neon-green/50 transition-all duration-300"
                required
                disabled={isLoading}
              />
            </div>
          )}

          {/* Password field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-700/80 border border-neon-green/30 rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green focus:shadow-neon-green/50 transition-all duration-300"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff size={18} className="text-slate-400 hover:text-slate-300 transition-colors" />
              ) : (
                <Eye size={18} className="text-slate-400 hover:text-slate-300 transition-colors" />
              )}
            </button>
          </div>

          {/* Role selection (only for registration) */}
          {!isLogin && (
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-dark-700/80 border border-neon-green/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green focus:shadow-neon-green/50 transition-all duration-300 appearance-none"
                disabled={isLoading}
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim() || (!isLogin && !email.trim())}
            className="w-full bg-gradient-to-r from-neon-green to-neon-cyan hover:from-neon-cyan hover:to-neon-blue disabled:from-dark-600 disabled:to-dark-500 text-dark-900 disabled:text-slate-400 font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-neon-green hover:shadow-neon-cyan disabled:shadow-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-900"></div>
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle between login and register */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleAuthMode}
            className="text-slate-300 hover:text-neon-green transition-colors duration-300 text-sm"
            disabled={isLoading}
          >
            {isLogin 
              ? "Don't have an account? Create one" 
              : 'Already have an account? Sign in'
            }
          </button>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-6 p-3 bg-dark-700/50 border border-slate-600/30 rounded-lg">
          <p className="text-slate-400 text-xs text-center">
            <strong>Demo:</strong> Use any username/password to login, or register a new account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
