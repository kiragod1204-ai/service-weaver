import React from 'react';
import { Shield, X, AlertTriangle, Check } from 'lucide-react';

const PasswordStrengthIndicator = ({ password }) => {
  const calculateStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) strength += 1; // lowercase
    if (/[A-Z]/.test(password)) strength += 1; // uppercase
    if (/[0-9]/.test(password)) strength += 1; // numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // special characters
    
    return Math.min(strength, 5);
  };

  const getStrengthInfo = (strength) => {
    switch (strength) {
      case 0:
        return {
          label: 'Very Weak',
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/50',
          icon: X,
          width: 'w-1/5'
        };
      case 1:
        return {
          label: 'Weak',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500/50',
          icon: X,
          width: 'w-2/5'
        };
      case 2:
        return {
          label: 'Fair',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/50',
          icon: AlertTriangle,
          width: 'w-3/5'
        };
      case 3:
        return {
          label: 'Good',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/50',
          icon: AlertTriangle,
          width: 'w-4/5'
        };
      case 4:
      case 5:
        return {
          label: 'Strong',
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/50',
          icon: Check,
          width: 'w-full'
        };
      default:
        return {
          label: 'Very Weak',
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/50',
          icon: X,
          width: 'w-1/5'
        };
    }
  };

  const strength = calculateStrength(password);
  const strengthInfo = getStrengthInfo(strength);
  const IconComponent = strengthInfo.icon;

  const getSuggestions = () => {
    const suggestions = [];
    
    if (password.length < 8) {
      suggestions.push('Use at least 8 characters');
    }
    if (password.length < 12) {
      suggestions.push('Consider 12+ characters for better security');
    }
    if (!/[a-z]/.test(password)) {
      suggestions.push('Add lowercase letters');
    }
    if (!/[A-Z]/.test(password)) {
      suggestions.push('Add uppercase letters');
    }
    if (!/[0-9]/.test(password)) {
      suggestions.push('Add numbers');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      suggestions.push('Add special characters (!@#$%^&*)');
    }
    
    return suggestions;
  };

  const suggestions = getSuggestions();

  if (!password) {
    return (
      <div className="mt-2 text-slate-500 text-xs">
        Password should be at least 6 characters long
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Strength indicator */}
      <div className="flex items-center space-x-2">
        <IconComponent size={14} className={strengthInfo.color} />
        <span className={`text-xs font-medium ${strengthInfo.color}`}>
          {strengthInfo.label}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-dark-600 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full ${strengthInfo.bgColor} ${strengthInfo.width} transition-all duration-300 ease-out`}
        ></div>
      </div>
      
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-slate-400 font-medium">Suggestions:</div>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="text-xs text-slate-500 flex items-start space-x-1">
              <span className="text-neon-green mt-0.5">•</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
