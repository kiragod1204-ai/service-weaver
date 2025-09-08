import React, { useCallback, useState } from 'react';
import { getSmoothStepPath } from 'reactflow';
import { X } from 'lucide-react';
import useStore from '../store/useStore';

const ServiceEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}) => {
  const { deleteConnection } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = useCallback((event) => {
    event.stopPropagation();
    const connectionId = parseInt(id);
    if (window.confirm('Are you sure you want to delete this connection?')) {
      deleteConnection(connectionId);
    }
  }, [id, deleteConnection]);

  // Check if we're in monitoring mode
  const isMonitoring = data?.isMonitoring || false;

  const handleEdgeClick = useCallback((event) => {
    if (isMonitoring) return; // Disable selection in monitoring mode
    event.stopPropagation();
    
    // Show delete confirmation on click
    const connectionId = parseInt(id);
    if (window.confirm('Are you sure you want to delete this connection?')) {
      deleteConnection(connectionId);
    }
  }, [isMonitoring, id, deleteConnection]);

  // Calculate midpoint for action menu
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Get connection status for monitoring mode
  const connectionStatus = data?.connection?.status || 'unknown';
  
  // Get color based on status in monitoring mode
  const getStatusColor = (status) => {
    if (!isMonitoring) return selected ? '#10b981' : (isHovered ? '#3b82f6' : '#64748b');
    
    switch (status) {
      case 'alive': return '#00ff88';
      case 'dead': return '#ff3366';
      case 'degraded': return '#ffaa00';
      case 'checking': return '#00aaff';
      default: return '#4b5563';
    }
  };

  const getFilter = (status) => {
    if (!isMonitoring) {
      return selected ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' : 
             isHovered ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))' : 'none';
    }
    
    switch (status) {
      case 'alive': return 'drop-shadow(0 0 6px rgba(0, 255, 136, 0.6))';
      case 'dead': return 'drop-shadow(0 0 6px rgba(255, 51, 102, 0.6))';
      case 'degraded': return 'drop-shadow(0 0 6px rgba(255, 170, 0, 0.6))';
      case 'checking': return 'drop-shadow(0 0 6px rgba(0, 170, 255, 0.6))';
      default: return 'none';
    }
  };

  return (
    <>
      <g>
        {/* Wider invisible path for easier selection */}
        <path
          d={edgePath}
          fill="none"
          strokeWidth="20"
          stroke="transparent"
          className={isMonitoring ? "cursor-default" : "cursor-pointer"}
          onClick={handleEdgeClick}
          onMouseEnter={() => !isMonitoring && setIsHovered(true)}
          onMouseLeave={() => !isMonitoring && setIsHovered(false)}
        />
        
        {/* Visible edge path */}
        <path
          id={id}
          style={{
            ...style,
            stroke: getStatusColor(connectionStatus),
            strokeWidth: isMonitoring ? 2 : (selected ? 4 : (isHovered ? 3 : 2)),
            filter: getFilter(connectionStatus),
          }}
          className={`react-flow__edge-path transition-all duration-200 ease-out ${isMonitoring ? 'cursor-default' : 'cursor-pointer'}`}
          d={edgePath}
          onClick={handleEdgeClick}
          onMouseEnter={() => !isMonitoring && setIsHovered(true)}
          onMouseLeave={() => !isMonitoring && setIsHovered(false)}
        />
        
        {/* Animated flow indicator */}
        <circle
          r="3"
          fill={getStatusColor(connectionStatus)}
          className="opacity-60"
        >
          <animateMotion
            dur={isMonitoring ? "5s" : "3s"}
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>

        {/* Delete button - only shows in edit mode */}
        {!isMonitoring && (selected || isHovered) && (
          <g
            transform={`translate(${midX}, ${midY})`}
            className="cursor-pointer"
            onClick={handleDelete}
          >
            {/* Background circle for delete button */}
            <circle
              r="16"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2"
              className="hover:opacity-80 transition-all duration-200"
            />
            {/* X icon */}
            <X
              size={16}
              color="#ffffff"
              className="pointer-events-none"
              style={{ transform: 'translate(-8px, -8px)' }}
            />
          </g>
        )}
      </g>
    </>
  );
};

export default ServiceEdge;
