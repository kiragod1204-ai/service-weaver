import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useStore from '../store/useStore';
import ServiceNode from './ServiceNode';
import ServiceEdge from './ServiceEdge';
import { RefreshCw, Play, Pause } from 'lucide-react';

const nodeTypes = {
  service: ServiceNode,
};

const edgeTypes = {
  service: ServiceEdge,
};

const MonitoringCanvas = ({ diagramId }) => {
  const { 
    services, 
    connections, 
    loadDiagram,
    connectWebSocket,
    isLoading,
    loadPositionsFromStorage,
    loadPositionsFromBackend,
    isAuthenticated
  } = useStore();
  
  const reactFlowInstance = useReactFlow();
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);
  const [autoReloadEnabled, setAutoReloadEnabled] = useState(true);
  const [autoReloadInterval, setAutoReloadInterval] = useState(30000); // 30 seconds default
  const [isReloading, setIsReloading] = useState(false);

  // Convert services to React Flow nodes
  const initialNodes = useMemo(() => 
    (services || []).map(service => ({
      id: service.id.toString(),
      type: 'service',
      position: { 
        x: service.position_x || 0, 
        y: service.position_y || 0 
      },
      data: { service, isMonitoring: true },
      draggable: false, // Disable dragging in monitoring mode
      selectable: false, // Disable selection in monitoring mode
    })), [services]
  );

  // Convert connections to React Flow edges
  const initialEdges = useMemo(() => 
    (connections || []).map(connection => ({
      id: connection.id.toString(),
      source: connection.source_id.toString(),
      target: connection.target_id.toString(),
      type: 'service',
      data: { connection, isMonitoring: true },
      selectable: false, // Disable selection in monitoring mode
      deletable: false, // Disable deletion in monitoring mode
    })), [connections]
  );

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Load diagram data when component mounts or diagramId changes
  useEffect(() => {
    if (diagramId) {
      // Use public load for monitoring view, private load for authenticated users
      if (isAuthenticated) {
        loadDiagram(diagramId);
        connectWebSocket();
      } else {
        // For public access, we need to use loadDiagramPublic from the store
        const { loadDiagramPublic } = useStore.getState();
        loadDiagramPublic(diagramId);
      }
    }
  }, [diagramId, isAuthenticated, loadDiagram, connectWebSocket]);

  // Load positions from localStorage after services are loaded
  useEffect(() => {
    if (services && services.length > 0) {
      // Try to load positions from localStorage first
      const loadedFromStorage = loadPositionsFromStorage();
      if (!loadedFromStorage) {
        // If not in localStorage, try to load from backend
        loadPositionsFromBackend();
      }
    }
  }, [services, loadPositionsFromStorage, loadPositionsFromBackend]);

  // Update nodes when services change
  useEffect(() => {
    const newNodes = (services || []).map(service => ({
      id: service.id.toString(),
      type: 'service',
      position: { 
        x: service.position_x || 0, 
        y: service.position_y || 0 
      },
      data: { service, isMonitoring: true },
      draggable: false,
      selectable: false,
    }));
    
    // Only update if nodes have actually changed
    setNodes(currentNodes => {
      const nodesChanged = JSON.stringify(currentNodes) !== JSON.stringify(newNodes);
      if (nodesChanged) {
        setLastUpdate(Date.now());
      }
      return nodesChanged ? newNodes : currentNodes;
    });
  }, [services, setNodes]);

  // Update edges when connections change
  useEffect(() => {
    const newEdges = (connections || []).map(connection => ({
      id: connection.id.toString(),
      source: connection.source_id.toString(),
      target: connection.target_id.toString(),
      type: 'service',
      data: { connection, isMonitoring: true },
      selectable: false,
      deletable: false,
    }));
    
    // Only update if edges have actually changed
    setEdges(currentEdges => {
      const edgesChanged = JSON.stringify(currentEdges) !== JSON.stringify(newEdges);
      return edgesChanged ? newEdges : currentEdges;
    });
  }, [connections, setEdges]);

  // Override the change handlers to be read-only
  const handleNodesChange = useCallback((changes) => {
    // In monitoring mode, we don't allow changes, but we still need to handle the callback
    setNodes((nds) => nds);
  }, [setNodes]);

  const handleEdgesChange = useCallback((changes) => {
    // In monitoring mode, we don't allow changes, but we still need to handle the callback
    setEdges((eds) => eds);
  }, [setEdges]);

  // Fit view when diagram is loaded and positions are synchronized
  useEffect(() => {
    if (nodes.length > 0 && !isInitialized && !isLoading) {
      const timer = setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
          setIsInitialized(true);
        }
      }, 500); // Small delay to ensure ReactFlow is fully rendered
      
      return () => clearTimeout(timer);
    }
  }, [nodes, isInitialized, isLoading, reactFlowInstance]);

  // Reset initialization when diagram changes
  useEffect(() => {
    setIsInitialized(false);
  }, [diagramId]);

  // Auto-reload functionality
  useEffect(() => {
    let intervalId;
    
    if (autoReloadEnabled && diagramId) {
      intervalId = setInterval(() => {
        handleManualReload();
      }, autoReloadInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoReloadEnabled, autoReloadInterval, diagramId, handleManualReload]);

  // Manual reload function
  const handleManualReload = useCallback(() => {
    if (isReloading) return;
    
    setIsReloading(true);
    
    // Reload diagram data using appropriate method based on auth status
    if (isAuthenticated) {
      loadDiagram(diagramId);
    } else {
      const { loadDiagramPublic } = useStore.getState();
      loadDiagramPublic(diagramId);
    }
    
    // Simulate loading state for better UX
    setTimeout(() => {
      setIsReloading(false);
      setLastUpdate(Date.now());
    }, 1000);
  }, [diagramId, isAuthenticated, isReloading, loadDiagram]);

  // Toggle auto-reload
  const toggleAutoReload = useCallback(() => {
    setAutoReloadEnabled(prev => !prev);
  }, []);

  // Update auto-reload interval
  const handleIntervalChange = useCallback((interval) => {
    setAutoReloadInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-neon-green">Loading monitoring view...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden">
        {/* Monitoring header */}
        <div className="absolute top-4 left-4 z-20 bg-dark-800/90 backdrop-blur-glass border border-neon-blue/30 rounded-lg px-4 py-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${autoReloadEnabled ? 'bg-neon-green animate-pulse' : 'bg-slate-500'}`}></div>
              <span className={`text-sm font-medium ${autoReloadEnabled ? 'text-neon-green' : 'text-slate-500'}`}>
                {autoReloadEnabled ? 'Live Monitoring' : 'Monitoring Paused'}
              </span>
            </div>
            <div className="text-slate-400 text-sm">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
            
            {/* Reload button */}
            <button
              onClick={handleManualReload}
              disabled={isReloading}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isReloading 
                  ? 'bg-slate-700 cursor-not-allowed' 
                  : 'bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/50 hover:border-neon-green'
              }`}
              title="Reload monitoring data"
            >
              <RefreshCw 
                className={`w-4 h-4 ${isReloading ? 'animate-spin text-slate-500' : 'text-neon-green'}`} 
              />
            </button>
            
            {/* Auto-reload toggle */}
            <button
              onClick={toggleAutoReload}
              className={`p-2 rounded-lg transition-all duration-200 ${
                autoReloadEnabled 
                  ? 'bg-neon-green/20 border border-neon-green/50 hover:bg-neon-green/30' 
                  : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
              }`}
              title={autoReloadEnabled ? 'Disable auto-reload' : 'Enable auto-reload'}
            >
              {autoReloadEnabled ? (
                <Pause className="w-4 h-4 text-neon-green" />
              ) : (
                <Play className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {/* Auto-reload interval selector */}
            <select
              value={autoReloadInterval}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="bg-dark-700 border border-slate-600 rounded px-2 py-1 text-slate-300 text-sm focus:border-neon-green focus:outline-none"
              title="Auto-reload interval"
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
          </div>
        </div>

        {/* Status legend */}
        <div className="absolute top-4 right-4 z-20 bg-dark-800/90 backdrop-blur-glass border border-neon-purple/30 rounded-lg px-4 py-2">
          <div className="text-slate-300 text-sm font-medium mb-2">Service Status</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-neon-green rounded-full"></div>
              <span className="text-slate-400 text-xs">Alive</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
              <span className="text-slate-400 text-xs">Checking</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-slate-400 text-xs">Degraded</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-slate-400 text-xs">Dead</span>
            </div>
          </div>
        </div>

        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gradient-shift 20s ease-in-out infinite'
          }}></div>
        </div>
        
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        className="bg-transparent relative z-10"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background 
          color="rgba(0, 255, 136, 0.15)" 
          gap={30} 
          size={2}
          variant="dots"
        />
        <Controls 
          className="bg-dark-800/90 backdrop-blur-glass border border-neon-green/20 rounded-xl shadow-neon-green/20 [&>button]:bg-dark-700/80 [&>button]:border-neon-green/30 [&>button]:text-neon-green [&>button:hover]:bg-neon-green/20 [&>button:hover]:shadow-neon-green/50"
          showInteractive={false} // Disable interactive controls in monitoring mode
        />
        <MiniMap 
          className="bg-dark-800/90 backdrop-blur-glass border border-neon-blue/20 rounded-xl shadow-neon-blue/20"
          nodeColor={(node) => {
            const status = node.data?.service?.current_status;
            switch (status) {
              case 'alive': return '#00ff88';
              case 'dead': return '#ff3366';
              case 'degraded': return '#ffaa00';
              case 'checking': return '#00aaff';
              default: return '#888899';
            }
          }}
          nodeStrokeWidth={2}
          nodeStrokeColor={(node) => {
            const status = node.data?.service?.current_status;
            switch (status) {
              case 'alive': return '#00ff88';
              case 'dead': return '#ff3366';
              case 'degraded': return '#ffaa00';
              case 'checking': return '#00aaff';
              default: return '#888899';
            }
          }}
          maskColor="rgba(10, 10, 15, 0.8)"
        />
      </ReactFlow>
      
      {/* Monitoring overlay effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Pulse effects for active services */}
        {services?.filter(s => s.current_status === 'alive' && s.position_x !== undefined && s.position_y !== undefined).map((service, index) => {
          let screenPos = { x: service.position_x, y: service.position_y };
          
          // Only convert to screen position if reactFlowInstance is available and valid
          if (reactFlowInstance && typeof reactFlowInstance.flowToScreenPosition === 'function' && reactFlowInstance.viewport) {
            try {
              screenPos = reactFlowInstance.flowToScreenPosition({ 
                x: service.position_x, 
                y: service.position_y 
              });
            } catch (error) {
              console.warn('Failed to convert flow to screen position:', error);
              // Fall back to raw position
            }
          }
          
          return (
            <div
              key={`pulse-${service.id}`}
              className="absolute w-4 h-4 bg-neon-green/30 rounded-full animate-ping"
              style={{
                left: `${screenPos.x}px`,
                top: `${screenPos.y}px`,
                animationDelay: `${index * 0.5}s`,
                transform: 'translate(-50%, -50%)',
                zIndex: 5
              }}
            ></div>
          );
        })}
      </div>
      </div>
  );
};

export default MonitoringCanvas;
