import React from 'react';
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
import useStore from '../store/useStore';

const serviceTypes = [
  { type: 'api', label: 'API Service', icon: Server },
  { type: 'database', label: 'Database', icon: Database },
  { type: 'cache', label: 'Cache', icon: HardDrive },
  { type: 'queue', label: 'Message Queue', icon: Zap },
  { type: 'web', label: 'Web Server', icon: Globe },
  { type: 'service', label: 'Microservice', icon: Cloud },
  { type: 'compute', label: 'Compute', icon: Cpu },
  { type: 'monitor', label: 'Monitoring', icon: Monitor },
];

const Sidebar = () => {
  const { currentDiagram, createService } = useStore();

  const handleDragStart = (event, serviceType) => {
    event.dataTransfer.setData('application/reactflow', serviceType.type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleAddService = async (serviceType) => {
    if (!currentDiagram) return;

    try {
      await createService({
        diagram_id: currentDiagram.id,
        name: `New ${serviceType.label}`,
        description: '',
        service_type: serviceType.type,
        icon: serviceType.type,
        host: '',
        port: 80,
        tags: '',
        position_x: Math.random() * 400 + 100,
        position_y: Math.random() * 400 + 100,
        healthcheck_url: '/health',
        polling_interval: 30,
        request_timeout: 5,
        expected_status: 200,
        status_mapping: {},
      });
    } catch (error) {
      console.error('Failed to create service:', error);
    }
  };

  if (!currentDiagram) {
    return (
      <div className="w-72 bg-dark-800/90 backdrop-blur-glass border-r border-neon-green/20 p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h3 className="text-xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-4">
            Service Catalog
          </h3>
          <p className="text-slate-400 text-sm bg-dark-700/50 p-3 rounded-xl border border-neon-green/10">
            Select a diagram to start adding services
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-dark-800/90 backdrop-blur-glass border-r border-neon-green/20 p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/3 left-0 w-24 h-24 bg-neon-blue/5 rounded-full blur-2xl animate-float" style={{animationDelay: '3s'}}></div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-2">
          Service Catalog
        </h3>
        <p className="text-neon-cyan/70 text-sm mb-6 font-mono">
          Click to add • Drag to position
        </p>
        
        <div className="space-y-3">
          {serviceTypes.map((serviceType) => {
            const IconComponent = serviceType.icon;
            return (
              <div
                key={serviceType.type}
                draggable
                onDragStart={(e) => handleDragStart(e, serviceType)}
                onClick={() => handleAddService(serviceType)}
                className="flex items-center space-x-4 p-4 bg-dark-700/60 hover:bg-dark-600/80 border border-neon-green/10 hover:border-neon-green/30 rounded-xl cursor-pointer transition-all duration-300 group hover:scale-105 hover:shadow-neon-green/20 backdrop-blur-sm"
              >
                <div className="relative">
                  <IconComponent 
                    size={22} 
                    className="text-neon-cyan/70 group-hover:text-neon-green transition-all duration-300 drop-shadow-lg group-hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]" 
                  />
                  {/* Icon glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <IconComponent size={22} className="text-neon-green blur-sm animate-pulse-neon" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white group-hover:text-neon-green transition-colors duration-300">
                    {serviceType.label}
                  </div>
                  <div className="text-xs text-neon-cyan/60 font-mono uppercase tracking-wider">
                    {serviceType.type}
                  </div>
                </div>
                {/* Hover indicator */}
                <div className="w-2 h-2 rounded-full bg-neon-green/0 group-hover:bg-neon-green transition-all duration-300 group-hover:shadow-neon-green"></div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 p-4 bg-gradient-to-br from-dark-700/80 to-dark-600/60 border border-neon-blue/20 rounded-2xl backdrop-blur-sm relative overflow-hidden">
          {/* Animated border */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-green/10 rounded-2xl blur-sm animate-gradient-shift bg-[length:200%_200%]"></div>
          
          <div className="relative z-10">
            <h4 className="text-sm font-bold text-neon-blue mb-3 flex items-center">
              <Zap size={16} className="mr-2" />
              Quick Tips
            </h4>
            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li className="flex items-center">
                <span className="text-neon-green mr-2">▸</span>
                Click to add to center
              </li>
              <li className="flex items-center">
                <span className="text-neon-blue mr-2">▸</span>
                Drag to specific position
              </li>
              <li className="flex items-center">
                <span className="text-neon-purple mr-2">▸</span>
                Connect via handles
              </li>
              <li className="flex items-center">
                <span className="text-neon-cyan mr-2">▸</span>
                Click nodes to configure
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;