import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    password: false
  });
  const [rememberMe, setRememberMe] = useState(false);
  
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  
  const store = useStore();
  const login = store?.login;
  const isLoading = store?.isLoading;
  const error = store?.error;
  const success = store?.success;

  // Auto-focus username field on component mount
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // Handle Enter key navigation between fields
  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextField?.current?.focus();
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'username':
        return value.trim().length >= 3;
      case 'password':
        return value.length >= 6;
      default:
        return true;
    }
  };

  const getFieldError = (field, value) => {
    if (!touched[field]) return '';
    
    switch (field) {
      case 'username':
        return value.trim().length < 3 ? 'Username must be at least 3 characters' : '';
      case 'password':
        return value.length < 6 ? 'Password must be at least 6 characters' : '';
      default:
        return '';
    }
  };

  const isFieldValid = (field, value) => {
    return touched[field] && validateField(field, value);
  };

  const isFieldInvalid = (field, value) => {
    return touched[field] && !validateField(field, value);
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      username: true,
      password: true
    });

    // Validate all required fields
    const isUsernameValid = validateField('username', username);
    const isPasswordValid = validateField('password', password);

    if (!isUsernameValid || !isPasswordValid) {
      return;
    }

    try {
      await login({ username, password, rememberMe });
    } catch (err) {
      // Error is handled by the store
      console.error('Authentication error:', err);
    }
  };

  const canSubmit = () => {
    const isUsernameValid = validateField('username', username);
    const isPasswordValid = validateField('password', password);
    
    return isUsernameValid && isPasswordValid && !isLoading;
  };

  return (
    <div 
      className="bg-dark-800/90 backdrop-blur-glass border border-neon-green/30 rounded-2xl p-8 w-96 shadow-glass-strong relative overflow-hidden animate-scale-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      aria-describedby="auth-description"
    >
      {/* Animated border glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 via-neon-blue/20 to-neon-purple/20 rounded-2xl blur-sm animate-gradient-shift bg-[length:200%_200%]"></div>
      
      <div className="relative z-10">
        <h2 
          id="auth-title"
          className="text-2xl font-bold mb-6 bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent"
        >
          Welcome Back
        </h2>
        
        <p 
          id="auth-description"
          className="text-slate-400 text-sm mb-6"
        >
          Sign in to access your system architecture diagrams
        </p>

        {/* Error display */}
        {error && (
          <div 
            className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center space-x-2 animate-fade-in animate-shake-error"
            role="alert"
            aria-live="assertive"
          >
            <XCircle size={16} className="text-red-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Success display */}
        {success && (
          <div 
            className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg flex items-center space-x-2 animate-fade-in animate-pulse-success"
            role="status"
            aria-live="polite"
          >
            <CheckCircle size={16} className="text-green-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-green-400 text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Username field */}
          <div className="relative">
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-slate-400" aria-hidden="true" />
            </div>
            <input
              ref={usernameRef}
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => handleBlur('username')}
              onKeyDown={(e) => handleKeyDown(e, passwordRef)}
              aria-invalid={isFieldInvalid('username', username)}
              aria-describedby={isFieldInvalid('username', username) ? 'username-error' : undefined}
              className={`w-full bg-dark-700/80 border rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                isFieldValid('username', username) 
                  ? 'border-green-500/50 focus:border-green-500 focus:shadow-green-500/50' 
                  : isFieldInvalid('username', username)
                  ? 'border-red-500/50 focus:border-red-500 focus:shadow-red-500/50'
                  : 'border-neon-green/30 focus:border-neon-green focus:shadow-neon-green/50'
              }`}
              required
              disabled={isLoading}
              autoComplete="username"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {isFieldValid('username', username) && (
                <CheckCircle size={18} className="text-green-500" aria-hidden="true" />
              )}
              {isFieldInvalid('username', username) && (
                <XCircle size={18} className="text-red-500" aria-hidden="true" />
              )}
            </div>
            {isFieldInvalid('username', username) && (
              <p id="username-error" className="text-red-400 text-xs mt-1">
                {getFieldError('username', username)}
              </p>
            )}
          </div>


          {/* Password field */}
          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-400" aria-hidden="true" />
            </div>
            <input
              ref={passwordRef}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              aria-invalid={isFieldInvalid('password', password)}
              aria-describedby={
                isFieldInvalid('password', password) 
                  ? 'password-error' 
                  : undefined
              }
              className={`w-full bg-dark-700/80 border rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                isFieldValid('password', password) 
                  ? 'border-green-500/50 focus:border-green-500 focus:shadow-green-500/50' 
                  : isFieldInvalid('password', password)
                  ? 'border-red-500/50 focus:border-red-500 focus:shadow-red-500/50'
                  : 'border-neon-green/30 focus:border-neon-green focus:shadow-neon-green/50'
              }`}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-8 pr-3 flex items-center"
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={18} className="text-slate-400 hover:text-slate-300 transition-colors" />
              ) : (
                <Eye size={18} className="text-slate-400 hover:text-slate-300 transition-colors" />
              )}
            </button>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {isFieldValid('password', password) && (
                <CheckCircle size={18} className="text-green-500" aria-hidden="true" />
              )}
              {isFieldInvalid('password', password) && (
                <XCircle size={18} className="text-red-500" aria-hidden="true" />
              )}
            </div>
            {isFieldInvalid('password', password) && (
              <p id="password-error" className="text-red-400 text-xs mt-1">
                {getFieldError('password', password)}
              </p>
            )}
            
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-neon-green bg-dark-700 border-neon-green/30 rounded focus:ring-neon-green focus:ring-2"
                disabled={isLoading}
                aria-describedby="remember-description"
              />
              <label htmlFor="rememberMe" className="text-slate-300 text-sm cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>


          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit()}
            aria-busy={isLoading}
            aria-live="polite"
            className="w-full bg-gradient-to-r from-neon-green to-neon-cyan hover:from-neon-cyan hover:to-neon-blue disabled:from-dark-600 disabled:to-dark-500 text-dark-900 disabled:text-slate-400 font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-neon-green hover:shadow-neon-cyan disabled:shadow-none disabled:transform-none flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <Lock size={18} aria-hidden="true" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>


        {/* First-run setup hint */}
        <div className="mt-6 p-3 bg-dark-700/50 border border-slate-600/30 rounded-lg">
          <p className="text-slate-400 text-xs text-center">
            <strong className="text-neon-green">First Run:</strong> If this is your first time, use "admin" as username to create the admin account.
          </p>
        </div>

        {/* Screen reader only status announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          className="sr-only"
          aria-atomic="true"
        >
          {isLoading && 'Signing in to your account'}
          {error && `Authentication error: ${error}`}
          {success && `Success: ${success}`}
        </div>
        
        {/* Hidden description for remember me */}
        <p id="remember-description" className="sr-only">
          Check this box to stay signed in for 30 days on this device
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
