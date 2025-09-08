/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern status colors with neon vibes
        'status-alive': '#00ff88',
        'status-dead': '#ff3366',
        'status-degraded': '#ffaa00',
        'status-checking': '#00aaff',
        'status-unknown': '#888899',
        
        // Modern primary colors
        'primary': '#00ff88',
        'primary-dark': '#00cc66',
        'primary-light': '#33ffaa',
        
        // Neon accents
        'neon-green': '#00ff88',
        'neon-blue': '#00aaff',
        'neon-purple': '#aa00ff',
        'neon-pink': '#ff0088',
        'neon-cyan': '#00ffff',
        'neon-orange': '#ff6600',
        'neon-yellow': '#ffff00',
        
        // Holographic colors
        'holo-1': '#ff00ff',
        'holo-2': '#00ffff',
        'holo-3': '#ffff00',
        'holo-4': '#ff0080',
        'holo-5': '#8000ff',
        
        // Ultra-modern gradients
        'ultra-primary': '#00d4ff',
        'ultra-secondary': '#ff0080',
        'ultra-accent': '#80ff00',
        
        // Modern dark theme
        'dark-900': '#0a0a0f',
        'dark-800': '#111118',
        'dark-700': '#1a1a24',
        'dark-600': '#242430',
        'dark-500': '#2d2d3d',
        'dark-400': '#404050',
      },
      boxShadow: {
        'status-alive': '0 0 30px rgba(0, 255, 136, 0.4), 0 0 60px rgba(0, 255, 136, 0.2)',
        'status-dead': '0 0 30px rgba(255, 51, 102, 0.4), 0 0 60px rgba(255, 51, 102, 0.2)',
        'status-degraded': '0 0 30px rgba(255, 170, 0, 0.4), 0 0 60px rgba(255, 170, 0, 0.2)',
        'status-checking': '0 0 30px rgba(0, 170, 255, 0.4), 0 0 60px rgba(0, 170, 255, 0.2)',
        'status-unknown': '0 0 30px rgba(136, 136, 153, 0.3), 0 0 60px rgba(136, 136, 153, 0.1)',
        
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3), 0 0 80px rgba(0, 255, 136, 0.1)',
        'neon-blue': '0 0 20px rgba(0, 170, 255, 0.5), 0 0 40px rgba(0, 170, 255, 0.3), 0 0 80px rgba(0, 170, 255, 0.1)',
        'neon-purple': '0 0 20px rgba(170, 0, 255, 0.5), 0 0 40px rgba(170, 0, 255, 0.3), 0 0 80px rgba(170, 0, 255, 0.1)',
        'neon-pink': '0 0 20px rgba(255, 0, 136, 0.5), 0 0 40px rgba(255, 0, 136, 0.3), 0 0 80px rgba(255, 0, 136, 0.1)',
        
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-strong': '0 8px 32px 0 rgba(31, 38, 135, 0.6)',
        
        // Ultra-modern holographic shadows
        'holo-glow': '0 0 40px rgba(255, 0, 255, 0.4), 0 0 80px rgba(0, 255, 255, 0.3), 0 0 120px rgba(255, 255, 0, 0.2)',
        'ultra-glow': '0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(255, 0, 128, 0.3), 0 0 90px rgba(128, 255, 0, 0.2)',
        'cyber-glow': '0 0 20px currentColor, 0 0 40px currentColor, 0 0 80px currentColor, 0 0 160px currentColor',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-neon': 'linear-gradient(135deg, #00ff88 0%, #00aaff 50%, #aa00ff 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        
        // Ultra-modern holographic gradients
        'gradient-holo': 'linear-gradient(45deg, #ff00ff 0%, #00ffff 25%, #ffff00 50%, #ff0080 75%, #8000ff 100%)',
        'gradient-ultra': 'linear-gradient(135deg, #00d4ff 0%, #ff0080 50%, #80ff00 100%)',
        'gradient-cyber': 'linear-gradient(90deg, #00ff88 0%, #00aaff 33%, #aa00ff 66%, #ff0088 100%)',
        'gradient-matrix': 'linear-gradient(180deg, #001100 0%, #003300 50%, #005500 100%)',
        'gradient-plasma': 'radial-gradient(circle at 30% 70%, #ff00ff 0%, #00ffff 50%, #ffff00 100%)',
        
        // Animated background patterns
        'pattern-grid': 'radial-gradient(circle at 1px 1px, rgba(0,255,136,0.3) 1px, transparent 0)',
        'pattern-dots': 'radial-gradient(circle at center, rgba(0,170,255,0.4) 1px, transparent 1px)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '16px',
      },
      animation: {
        'pulse-alive': 'pulse-alive 2s ease-in-out infinite',
        'pulse-checking': 'pulse-checking 1s ease-in-out infinite',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 2s ease-in-out infinite alternate',
        'cyber-scan': 'cyber-scan 3s linear infinite',
        
        // Ultra-modern holographic animations
        'holo-shift': 'holo-shift 4s ease-in-out infinite',
        'plasma-flow': 'plasma-flow 6s ease-in-out infinite',
        'matrix-rain': 'matrix-rain 10s linear infinite',
        'ultra-pulse': 'ultra-pulse 3s ease-in-out infinite',
        'cyber-glitch': 'cyber-glitch 0.3s ease-in-out',
        'hologram-flicker': 'hologram-flicker 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-alive': {
          '0%, 100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.3)'
          },
          '50%': { 
            transform: 'scale(1.05)',
            boxShadow: '0 0 30px rgba(0, 255, 136, 0.8), 0 0 60px rgba(0, 255, 136, 0.4), 0 0 90px rgba(0, 255, 136, 0.2)'
          },
        },
        'pulse-checking': {
          '0%, 100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 20px rgba(0, 170, 255, 0.6), 0 0 40px rgba(0, 170, 255, 0.3)'
          },
          '50%': { 
            transform: 'scale(1.08)',
            boxShadow: '0 0 30px rgba(0, 170, 255, 0.8), 0 0 60px rgba(0, 170, 255, 0.4)'
          },
        },
        'pulse-neon': {
          '0%, 100%': { 
            boxShadow: '0 0 20px currentColor, 0 0 40px currentColor, 0 0 80px currentColor'
          },
          '50%': { 
            boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor'
          },
        },
        'glow-pulse': {
          '0%, 100%': { 
            filter: 'brightness(1) saturate(1)',
            transform: 'scale(1)'
          },
          '50%': { 
            filter: 'brightness(1.2) saturate(1.3)',
            transform: 'scale(1.02)'
          },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-3px) rotate(-1deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(3px) rotate(1deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.8) rotate(-5deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'cyber-scan': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        
        // Ultra-modern holographic keyframes
        'holo-shift': {
          '0%, 100%': { 
            backgroundPosition: '0% 50%',
            filter: 'hue-rotate(0deg) saturate(1)'
          },
          '25%': { 
            backgroundPosition: '100% 0%',
            filter: 'hue-rotate(90deg) saturate(1.2)'
          },
          '50%': { 
            backgroundPosition: '100% 100%',
            filter: 'hue-rotate(180deg) saturate(1.4)'
          },
          '75%': { 
            backgroundPosition: '0% 100%',
            filter: 'hue-rotate(270deg) saturate(1.2)'
          },
        },
        'plasma-flow': {
          '0%, 100%': { 
            backgroundPosition: '0% 0%',
            transform: 'scale(1) rotate(0deg)'
          },
          '33%': { 
            backgroundPosition: '100% 50%',
            transform: 'scale(1.05) rotate(120deg)'
          },
          '66%': { 
            backgroundPosition: '50% 100%',
            transform: 'scale(0.95) rotate(240deg)'
          },
        },
        'matrix-rain': {
          '0%': { 
            transform: 'translateY(-100%)',
            opacity: '0'
          },
          '10%': { 
            opacity: '1'
          },
          '90%': { 
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(100vh)',
            opacity: '0'
          },
        },
        'ultra-pulse': {
          '0%, 100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(255, 0, 128, 0.3), 0 0 90px rgba(128, 255, 0, 0.2)'
          },
          '50%': { 
            transform: 'scale(1.1)',
            boxShadow: '0 0 50px rgba(0, 212, 255, 0.8), 0 0 100px rgba(255, 0, 128, 0.5), 0 0 150px rgba(128, 255, 0, 0.3)'
          },
        },
        'cyber-glitch': {
          '0%, 100%': { 
            transform: 'translate(0)',
            filter: 'hue-rotate(0deg)'
          },
          '20%': { 
            transform: 'translate(-2px, 2px)',
            filter: 'hue-rotate(90deg)'
          },
          '40%': { 
            transform: 'translate(-2px, -2px)',
            filter: 'hue-rotate(180deg)'
          },
          '60%': { 
            transform: 'translate(2px, 2px)',
            filter: 'hue-rotate(270deg)'
          },
          '80%': { 
            transform: 'translate(2px, -2px)',
            filter: 'hue-rotate(360deg)'
          },
        },
        'hologram-flicker': {
          '0%, 100%': { 
            opacity: '1',
            filter: 'brightness(1) contrast(1)'
          },
          '25%': { 
            opacity: '0.8',
            filter: 'brightness(1.2) contrast(1.1)'
          },
          '50%': { 
            opacity: '0.9',
            filter: 'brightness(0.9) contrast(1.2)'
          },
          '75%': { 
            opacity: '0.7',
            filter: 'brightness(1.1) contrast(0.9)'
          },
        },
      },
    },
  },
  plugins: [],
}