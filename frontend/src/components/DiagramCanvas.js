import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  useKeyPress,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useStore from '../store/useStore';
import ServiceNode from './ServiceNode';
import ServiceEdge from './ServiceEdge';
import { Copy } from 'lucide-react';

const nodeTypes = {
  service: ServiceNode,
};

const edgeTypes = {
  service: ServiceEdge,
};

const DiagramCanvas = () => {
  const { 
    services, 
    connections, 
    updateServicePosition, 
    createConnection,
    createService, // Added createService
    setSelectedService,
    selectedService, // Added selectedService
    deleteConnection,
    deleteService, // Added deleteService
    loadPositionsFromStorage,
    savePositionsToBackend,
    currentDiagram, // Added currentDiagram
    updateService, // Added updateService
    setCopiedService, // Added for copy/paste
    pasteService // Added for copy/paste
  } = useStore();
  
  const [selectedEdge, setSelectedEdge] = useState(null);
  const deleteKeyPressed = useKeyPress('Delete');
  const eKeyPressed = useKeyPress('e');
  const pKeyPressed = useKeyPress('p');
  const escapePressed = useKeyPress('Escape');
  const ctrlCPressed = useKeyPress(['Control+c', 'Meta+c']); // For Windows/Linux and macOS
  const ctrlVPressed = useKeyPress(['Control+v', 'Meta+v']); // For Windows/Linux and macOS
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Convert services to React Flow nodes
  const initialNodes = useMemo(() => 
    (services || []).map(service => ({
      id: service.id.toString(),
      type: 'service',
      position: { x: service.position_x, y: service.position_y },
      data: { 
        service,
        onServiceUpdate: updateService 
      },
    })), [services, updateService]
  );

  // Convert connections to React Flow edges
  const initialEdges = useMemo(() => 
    (connections || []).map(connection => ({
      id: connection.id.toString(),
      source: connection.source_id.toString(),
      target: connection.target_id.toString(),
      type: 'service',
      data: { connection },
    })), [connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when services change
  useEffect(() => {
    const newNodes = (services || []).map(service => ({
      id: service.id.toString(),
      type: 'service',
      position: { x: service.position_x, y: service.position_y },
      data: { 
        service,
        onServiceUpdate: updateService 
      },
    }));
    
    // Only update if nodes have actually changed
    setNodes(currentNodes => {
      const nodesChanged = JSON.stringify(currentNodes) !== JSON.stringify(newNodes);
      return nodesChanged ? newNodes : currentNodes;
    });
  }, [services, setNodes, updateService]);

  // Update edges when connections change
  useEffect(() => {
    const newEdges = (connections || []).map(connection => ({
      id: connection.id.toString(),
      source: connection.source_id.toString(),
      target: connection.target_id.toString(),
      type: 'service',
      data: { connection },
    }));
    
    // Only update if edges have actually changed
    setEdges(currentEdges => {
      const edgesChanged = JSON.stringify(currentEdges) !== JSON.stringify(newEdges);
      return edgesChanged ? newEdges : currentEdges;
    });
  }, [connections, setEdges]);

  const onConnect = useCallback(
    (params) => {
      const sourceId = parseInt(params.source);
      const targetId = parseInt(params.target);
      const diagramId = (services || []).find(s => s.id === sourceId)?.diagram_id;
      
      if (diagramId) {
        createConnection({
          diagram_id: diagramId,
          source_id: sourceId,
          target_id: targetId,
        });
      }
    },
    [services, createConnection]
  );

  const onNodeDragStop = useCallback(
    (event, node) => {
      const serviceId = parseInt(node.id);
      updateServicePosition(serviceId, node.position);
    },
    [updateServicePosition]
  );

  const onNodeClick = useCallback(
    (event, node) => {
      const service = (services || []).find(s => s.id.toString() === node.id);
      setSelectedService(service);
    },
    [services, setSelectedService]
  );

  const onPaneClick = useCallback(() => {
    setSelectedService(null);
    setSelectedEdge(null);
  }, [setSelectedService]);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedService(null);
  }, [setSelectedService]);

  const onEdgesDelete = useCallback((edgesToDelete) => {
    edgesToDelete.forEach(edge => {
      const connectionId = parseInt(edge.id);
      deleteConnection(connectionId);
    });
    setSelectedEdge(null);
  }, [deleteConnection]);

  // Handle delete key press
  useEffect(() => {
    if (deleteKeyPressed && selectedEdge) {
      const connectionId = parseInt(selectedEdge.id);
      if (window.confirm('Are you sure you want to delete this connection?')) {
        deleteConnection(connectionId);
        setSelectedEdge(null);
      }
    }
  }, [deleteKeyPressed, selectedEdge, deleteConnection]);

  // Handle delete key press for selected service node
  useEffect(() => {
    if (deleteKeyPressed && selectedService) {
      if (window.confirm('Are you sure you want to delete this service?')) {
        deleteService(selectedService.id);
      }
    }
  }, [deleteKeyPressed, selectedService, deleteService]);

  // Handle 'E' key for edit edge
  useEffect(() => {
    if (eKeyPressed && selectedEdge) {
      console.log('Edit edge:', selectedEdge.id);
      // TODO: Implement edge editing functionality
      // For now, just show a notification
      alert(`Edit connection ${selectedEdge.id} - Feature coming soon!`);
    }
  }, [eKeyPressed, selectedEdge]);

  // Handle 'P' key for edge properties
  useEffect(() => {
    if (pKeyPressed && selectedEdge) {
      console.log('Show properties for edge:', selectedEdge.id);
      // TODO: Implement edge properties functionality
      // For now, just show a notification
      alert(`Properties for connection ${selectedEdge.id} - Feature coming soon!`);
    }
  }, [pKeyPressed, selectedEdge]);

  // Handle Escape key to deselect
  useEffect(() => {
    if (escapePressed) {
      setSelectedEdge(null);
      setSelectedService(null);
    }
  }, [escapePressed, setSelectedService]);

  // Handle Ctrl+C (Copy)
  useEffect(() => {
    if (ctrlCPressed && selectedService) {
      setCopiedService(selectedService);
      // Optional: Provide user feedback
      console.log('Service copied:', selectedService.name);
    }
  }, [ctrlCPressed, selectedService, setCopiedService]);

  // Handle Ctrl+V (Paste)
  useEffect(() => {
    if (ctrlVPressed) {
      pasteService();
    }
  }, [ctrlVPressed, pasteService]);

  // Load positions from localStorage when services are loaded
  useEffect(() => {
    if (services && services.length > 0) {
      loadPositionsFromStorage();
    }
  }, [services, loadPositionsFromStorage]);

  // Auto-save positions to backend every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (services && services.length > 0) {
        savePositionsToBackend();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [services, savePositionsToBackend]);

  const onInit = useCallback((rfInstance) => {
    setReactFlowInstance(rfInstance);
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance || !currentDiagram) {
        return;
      }

      const serviceType = event.dataTransfer.getData('application/reactflow');
      
      if (!serviceType) {
        return;
      }

      // Get position relative to the ReactFlow pane
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Find the service label from the type (this could be improved by passing more data or having a mapping)
      const serviceTypes = [
        { type: 'api', label: 'API Service' },
        { type: 'database', label: 'Database' },
        { type: 'cache', label: 'Cache' },
        { type: 'queue', label: 'Message Queue' },
        { type: 'web', label: 'Web Server' },
        { type: 'service', label: 'Microservice' },
        { type: 'compute', label: 'Compute' },
        { type: 'monitor', label: 'Monitoring' },
      ];
      const serviceTypeInfo = serviceTypes.find(s => s.type === serviceType);

      if (!serviceTypeInfo) {
        console.error('Unknown service type:', serviceType);
        return;
      }

      createService({
        diagram_id: currentDiagram.id,
        name: `New ${serviceTypeInfo.label}`,
        description: '',
        service_type: serviceTypeInfo.type,
        icon: serviceTypeInfo.type,
        host: '',
        port: 80,
        tags: '',
        position_x: position.x,
        position_y: position.y,
        healthcheck_url: '/health',
        polling_interval: 30,
        request_timeout: 5,
        expected_status: 200,
        status_mapping: {},
      });
    },
    [reactFlowInstance, currentDiagram, createService]
  );

  return (
    <ReactFlowProvider>
      <div className="h-full w-full relative overflow-hidden">
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        onEdgesDelete={onEdgesDelete}
        onInit={onInit}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        className="bg-transparent relative z-10"
        deleteKeyCode={null} // Disable default delete behavior to use our custom one
      >
        <Background 
          color="rgba(0, 255, 136, 0.15)" 
          gap={30} 
          size={2}
          variant="dots"
        />
        <Controls className="bg-dark-800/90 backdrop-blur-glass border border-neon-green/20 rounded-xl shadow-neon-green/20 [&>button]:bg-dark-700/80 [&>button]:border-neon-green/30 [&>button]:text-neon-green [&>button:hover]:bg-neon-green/20 [&>button:hover]:shadow-neon-green/50" />
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
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-neon-green/30 rounded-full animate-float blur-sm"></div>
        <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-neon-blue/40 rounded-full animate-float blur-sm" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-neon-purple/20 rounded-full animate-float blur-sm" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/6 right-1/4 w-1 h-1 bg-neon-cyan/30 rounded-full animate-float blur-sm" style={{animationDelay: '6s'}}></div>
      </div>
      </div>
    </ReactFlowProvider>
  );
};

export default DiagramCanvas;
