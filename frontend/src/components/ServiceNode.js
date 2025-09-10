import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Server, 
  Database, 
  Cloud, 
  Zap, 
  Globe,
  HardDrive,
  Cpu,
  Monitor
} from 'lucide-react';

const iconMap = {
  api: Server,
  database: Database,
  cache: HardDrive,
  queue: Zap,
  web: Globe,
  service: Cloud,
  compute: Cpu,
  monitor: Monitor,
};

const ServiceNode = ({ data, selected }) => {
  const { service } = data;
  const [prevStatus, setPrevStatus] = useState(service.current_status);
  const [shouldShake, setShouldShake] = useState(false);
  const [imageError, setImageError] = useState(false);

  const IconComponent = iconMap[service.service_type] || Server;

  // Reset image error when service changes
  useEffect(() => {
    setImageError(false);
  }, [service.icon]);

  // Trigger shake animation when status changes to dead
  useEffect(() => {
    if (prevStatus !== 'dead' && service.current_status === 'dead') {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    }
    setPrevStatus(service.current_status);
  }, [service.current_status, prevStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'alive': return 'border-status-alive bg-dark-800/90 shadow-status-alive backdrop-blur-glass';
      case 'dead': return 'border-status-dead bg-dark-800/90 shadow-status-dead backdrop-blur-glass';
      case 'degraded': return 'border-status-degraded bg-dark-800/90 shadow-status-degraded backdrop-blur-glass';
      case 'checking': return 'border-status-checking bg-dark-800/90 shadow-status-checking backdrop-blur-glass';
      default: return 'border-status-unknown bg-dark-800/90 shadow-status-unknown backdrop-blur-glass';
    }
  };

  const getAnimation = (status) => {
    switch (status) {
      case 'alive': return 'animate-pulse-alive';
      case 'checking': return 'animate-pulse-checking';
      default: return '';
    }
  };

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-neon-green !border-2 !border-neon-green/50 !shadow-neon-green hover:!shadow-neon-green transition-all duration-300"
      />
      
      <div
        className={`
          min-w-[180px] px-5 py-4 rounded-2xl border-2 transition-all duration-500 cursor-pointer relative overflow-hidden
          ${getStatusColor(service.current_status)}
          ${getAnimation(service.current_status)}
          ${shouldShake ? 'animate-shake' : ''}
          ${selected ? 'ring-2 ring-neon-green shadow-neon-green' : ''}
          hover:scale-105 hover:shadow-2xl transform-gpu
        `}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-glass opacity-30 rounded-2xl"></div>
        
        {/* Cyber scan line effect for checking status */}
        {service.current_status === 'checking' && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-neon-blue to-transparent animate-cyber-scan"></div>
          </div>
        )}
        
        <div className="relative z-10">
          {/* Header with icon and name */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative group">
              {/* Display custom icon if available, valid, and not empty, otherwise use default icon */}
              {service.icon && service.icon.trim() !== '' && !imageError ? (
                <img 
                  src={service.icon} 
                  alt={service.name}
                  className="w-8 h-8 rounded-lg object-cover border-2 border-transparent group-hover:border-neon-blue transition-all duration-300"
                  onError={() => setImageError(true)}
                />
              ) : (
                <IconComponent 
                  size={20} 
                  className={`
                    transition-all duration-300 drop-shadow-lg
                    ${service.current_status === 'alive' ? 'text-status-alive drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]' : ''}
                    ${service.current_status === 'dead' ? 'text-status-dead drop-shadow-[0_0_8px_rgba(255,51,102,0.8)]' : ''}
                    ${service.current_status === 'degraded' ? 'text-status-degraded drop-shadow-[0_0_8px_rgba(255,170,0,0.8)]' : ''}
                    ${service.current_status === 'checking' ? 'text-status-checking drop-shadow-[0_0_8px_rgba(0,170,255,0.8)]' : ''}
                    ${service.current_status === 'unknown' ? 'text-status-unknown' : ''}
                  `}
                />
              )}
              
              {/* Icon glow effect */}
              {service.current_status === 'alive' && (!service.icon || service.icon.trim() === '' || imageError) && (
                <div className="absolute inset-0 animate-pulse-neon">
                  <IconComponent size={20} className="text-status-alive opacity-50 blur-sm" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-base truncate tracking-wide">
                {service.name}
              </div>
            </div>
          </div>
          
          {/* Connection info */}
          <div className="space-y-1 mb-3">
            {service.host && service.port && (
              <div className="text-sm text-neon-cyan font-mono bg-dark-900/50 px-2 py-1 rounded-lg border border-neon-cyan/20">
                {service.host}:{service.port}
              </div>
            )}
          </div>

          {/* Tags */}
          {service.tags && service.tags.trim() !== '' && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {service.tags.split(',').map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r from-purple-600/40 to-pink-600/40 text-purple-200 border border-purple-400/30 shadow-[0_0_8px_rgba(192,132,252,0.3)] backdrop-blur-sm transition-all duration-300 hover:from-purple-500/50 hover:to-pink-500/50 hover:border-purple-300/50 hover:shadow-[0_0_12px_rgba(192,132,252,0.5)] hover:scale-105"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className={`
              text-sm font-bold uppercase tracking-wider px-2 py-1 rounded-lg
              ${service.current_status === 'alive' ? 'text-status-alive bg-status-alive/20 border border-status-alive/30' : ''}
              ${service.current_status === 'dead' ? 'text-status-dead bg-status-dead/20 border border-status-dead/30' : ''}
              ${service.current_status === 'degraded' ? 'text-status-degraded bg-status-degraded/20 border border-status-degraded/30' : ''}
              ${service.current_status === 'checking' ? 'text-status-checking bg-status-checking/20 border border-status-checking/30' : ''}
              ${service.current_status === 'unknown' ? 'text-status-unknown bg-status-unknown/20 border border-status-unknown/30' : ''}
            `}>
              {service.current_status || 'unknown'}
            </div>
            <div className="relative">
              <div 
                className={`
                  w-4 h-4 rounded-full transition-all duration-300 relative
                  ${service.current_status === 'alive' ? 'bg-status-alive shadow-status-alive animate-pulse-neon' : ''}
                  ${service.current_status === 'dead' ? 'bg-status-dead shadow-status-dead' : ''}
                  ${service.current_status === 'degraded' ? 'bg-status-degraded shadow-status-degraded animate-neon-flicker' : ''}
                  ${service.current_status === 'checking' ? 'bg-status-checking shadow-status-checking animate-pulse-checking' : ''}
                  ${service.current_status === 'unknown' ? 'bg-status-unknown shadow-status-unknown' : ''}
                `}
              />
              {/* Outer glow ring for alive status */}
              {service.current_status === 'alive' && (
                <div className="absolute inset-0 w-4 h-4 rounded-full border-2 border-status-alive animate-ping opacity-75"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-neon-blue !border-2 !border-neon-blue/50 !shadow-neon-blue hover:!shadow-neon-blue transition-all duration-300"
      />
    </div>
  );
};

export default ServiceNode;
