import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Activity } from 'lucide-react';
import useStore from '../store/useStore';

const InspectorPanel = () => {
  const { selectedService, updateService, deleteService, setSelectedService } = useStore();
  const [formData, setFormData] = useState({});
  const [statusMapping, setStatusMapping] = useState('');
  const [healthCheckMethod, setHealthCheckMethod] = useState('HTTP');

  useEffect(() => {
    if (selectedService) {
      setFormData({
        name: selectedService.name || '',
        description: selectedService.description || '',
        service_type: selectedService.service_type || 'api',
        host: selectedService.host || '',
        port: selectedService.port || 80,
        tags: selectedService.tags || '',
        healthcheck_method: selectedService.healthcheck_method || 'HTTP',
        healthcheck_url: selectedService.healthcheck_url || '/health',
        polling_interval: selectedService.polling_interval || 30,
        request_timeout: selectedService.request_timeout || 5,
        expected_status: selectedService.expected_status || 200,
        http_method: selectedService.http_method || 'GET',
        headers: selectedService.headers ? JSON.stringify(selectedService.headers, null, 2) : '',
        body: selectedService.body || '',
        ssl_verify: selectedService.ssl_verify !== false,
        follow_redirects: selectedService.follow_redirects !== false,
        tcp_send_data: selectedService.tcp_send_data || '',
        tcp_expect_data: selectedService.tcp_expect_data || '',
        udp_send_data: selectedService.udp_send_data || '',
        udp_expect_data: selectedService.udp_expect_data || '',
        icmp_packet_count: selectedService.icmp_packet_count || 3,
        dns_query_type: selectedService.dns_query_type || 'A',
        dns_expected_result: selectedService.dns_expected_result || '',
        kafka_topic: selectedService.kafka_topic || '',
        kafka_client_id: selectedService.kafka_client_id || '',
        frontend_host_url: selectedService.frontend_host_url || '',
      });
      setHealthCheckMethod(selectedService.healthcheck_method || 'HTTP');
      setStatusMapping(JSON.stringify(selectedService.status_mapping || {}, null, 2));
    }
  }, [selectedService]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedService) return;

    try {
      let parsedStatusMapping = {};
      if (statusMapping.trim()) {
        parsedStatusMapping = JSON.parse(statusMapping);
      }

      let parsedHeaders = {};
      if (formData.headers && formData.headers.trim()) {
        try {
          parsedHeaders = JSON.parse(formData.headers);
        } catch (error) {
          console.error('Failed to parse headers JSON:', error);
          alert('Invalid JSON in headers field. Please check your syntax.');
          return;
        }
      }

      await updateService({
        ...selectedService,
        ...formData,
        port: parseInt(formData.port) || 80,
        polling_interval: parseInt(formData.polling_interval) || 30,
        request_timeout: parseInt(formData.request_timeout) || 5,
        expected_status: parseInt(formData.expected_status) || 200,
        status_mapping: parsedStatusMapping,
        headers: parsedHeaders,
      });
    } catch (error) {
      console.error('Failed to update service:', error);
      alert('Failed to save service. Please check your JSON syntax.');
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;
    
    if (window.confirm('Are you sure you want to delete this service?')) {
      await deleteService(selectedService.id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'alive': return 'text-status-alive';
      case 'dead': return 'text-status-dead';
      case 'degraded': return 'text-status-degraded';
      case 'checking': return 'text-status-checking';
      default: return 'text-status-unknown';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'alive': return 'Healthy';
      case 'dead': return 'Down';
      case 'degraded': return 'Degraded';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  if (!selectedService) {
    return (
      <div className="w-80 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-800/90 border-l border-gradient-to-b from-cyan-400/30 to-purple-500/30 p-4 backdrop-blur-xl relative overflow-hidden">
        {/* Holographic background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
        
        <div className="text-center text-slate-300 mt-8 relative z-10">
          <div className="relative inline-block">
            <Activity size={48} className="mx-auto mb-4 text-cyan-400/70 animate-pulse" />
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-ping"></div>
          </div>
          <h3 className="text-lg font-medium mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            No Service Selected
          </h3>
          <p className="text-sm text-slate-400/80">
            Click on a service node to view and edit its configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="inspector-panel w-80 bg-gradient-to-br from-slate-900/95 via-indigo-900/30 to-slate-800/95 border-l border-gradient-to-b from-cyan-400/40 via-purple-500/30 to-pink-500/20 flex flex-col backdrop-blur-xl relative overflow-hidden">
      {/* Holographic background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-purple-500/5 to-pink-500/3 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"></div>
      
      {/* Header */}
      <div className="p-4 border-b border-gradient-to-r from-cyan-500/20 via-purple-500/30 to-pink-500/20 flex items-center justify-between relative z-10">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          Service Configuration
        </h3>
        <button
          onClick={() => setSelectedService(null)}
          className="text-slate-400 hover:text-cyan-300 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10">
        {/* Status */}
        <div className="bg-gradient-to-br from-slate-800/80 via-indigo-900/40 to-slate-700/80 rounded-xl p-4 border border-cyan-500/20 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
          
          <h4 className="text-sm font-medium bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent mb-3 relative z-10">
            Current Status
          </h4>
          <div className="flex items-center space-x-3 relative z-10">
            <div className="relative">
              <div 
                className={`w-4 h-4 rounded-full relative z-10 ${
                  selectedService.current_status === 'alive' ? 'bg-status-alive' :
                  selectedService.current_status === 'dead' ? 'bg-status-dead' :
                  selectedService.current_status === 'degraded' ? 'bg-status-degraded' :
                  selectedService.current_status === 'checking' ? 'bg-status-checking' :
                  'bg-status-unknown'
                }`}
              />
              <div 
                className={`absolute inset-0 rounded-full blur-md animate-pulse ${
                  selectedService.current_status === 'alive' ? 'bg-status-alive' :
                  selectedService.current_status === 'dead' ? 'bg-status-dead' :
                  selectedService.current_status === 'degraded' ? 'bg-status-degraded' :
                  selectedService.current_status === 'checking' ? 'bg-status-checking' :
                  'bg-status-unknown'
                }`}
              />
            </div>
            <span className={`font-medium text-lg ${getStatusColor(selectedService.current_status)} drop-shadow-[0_0_8px_currentColor]`}>
              {getStatusLabel(selectedService.current_status)}
            </span>
          </div>
          {selectedService.last_checked && (
            <p className="text-xs text-slate-400/80 mt-2 relative z-10">
              Last checked: {new Date(selectedService.last_checked).toLocaleString()}
            </p>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-gradient-to-br from-slate-800/60 via-purple-900/30 to-slate-700/60 rounded-xl p-4 border border-purple-500/20 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/3 to-pink-500/5 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"></div>
          
          <h4 className="text-sm font-medium bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-4 relative z-10">
            Basic Information
          </h4>
          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs text-slate-300/80 mb-2 font-medium">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-cyan-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300/80 mb-2 font-medium">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-cyan-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300/80 mb-2 font-medium">Service Type</label>
              <select
                value={formData.service_type || 'api'}
                onChange={(e) => handleInputChange('service_type', e.target.value)}
                className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-cyan-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40"
              >
                <option value="api">🔌 API Service</option>
                <option value="database">🗄️ Database</option>
                <option value="cache">⚡ Cache</option>
                <option value="queue">📬 Message Queue</option>
                <option value="web">🌐 Web Server</option>
                <option value="service">⚙️ Microservice</option>
                <option value="compute">💻 Compute</option>
                <option value="monitor">📊 Monitoring</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300/80 mb-2 font-medium">Tags</label>
              <input
                type="text"
                value={formData.tags || ''}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="production, critical, api"
                className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-cyan-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40 placeholder:text-slate-400/60"
              />
            </div>
          </div>
        </div>

        {/* Connectivity */}
        <div className="bg-gradient-to-br from-slate-800/60 via-blue-900/30 to-slate-700/60 rounded-xl p-4 border border-blue-500/20 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 to-cyan-500/5 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"></div>
          
          <h4 className="text-sm font-medium bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-4 relative z-10">
            🌐 Connectivity
          </h4>
          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs text-slate-300/80 mb-2 font-medium">Host</label>
              <input
                type="text"
                value={formData.host || ''}
                onChange={(e) => handleInputChange('host', e.target.value)}
                placeholder="api.example.com"
                className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-blue-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40 placeholder:text-slate-400/60"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300/80 mb-2 font-medium">Port</label>
              <input
                type="number"
                value={formData.port || ''}
                onChange={(e) => handleInputChange('port', e.target.value)}
                className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-blue-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40"
              />
            </div>
          </div>
        </div>

        {/* Healthcheck */}
        <div className="bg-gradient-to-br from-slate-800/60 via-emerald-900/30 to-slate-700/60 rounded-xl p-4 border border-emerald-500/20 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 to-green-500/5 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"></div>
          
          <h4 className="text-sm font-medium bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent mb-4 relative z-10">
            ⚡ Health Check Configuration
          </h4>
          <div className="space-y-4 relative z-10">
            {/* Health Check Method Selector */}
            <div>
              <label className="block text-xs text-slate-300/80 mb-2 font-medium">Health Check Method</label>
              <select
                value={healthCheckMethod}
                onChange={(e) => {
                  setHealthCheckMethod(e.target.value);
                  handleInputChange('healthcheck_method', e.target.value);
                }}
                className="w-full bg-slate-800/90 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40"
              >
                <option value="HTTP">🌐 HTTP</option>
                <option value="HTTPS">🔒 HTTPS</option>
                <option value="TCP">🔌 TCP Connection</option>
                <option value="UDP">📡 UDP</option>
                <option value="ICMP">📶 ICMP Ping</option>
                <option value="DNS">🌍 DNS Query</option>
                <option value="WEBSOCKET">⚡ WebSocket</option>
                <option value="WSS">🔒 WebSocket Secure</option>
                <option value="GRPC">🚀 gRPC</option>
                <option value="SMTP">📧 SMTP</option>
                <option value="FTP">📁 FTP</option>
                <option value="SSH">🔐 SSH</option>
                <option value="REDIS">🔴 Redis</option>
                <option value="MYSQL">🐬 MySQL</option>
                <option value="POSTGRES">🐘 PostgreSQL</option>
                <option value="MONGODB">🍃 MongoDB</option>
                <option value="KAFKA">📨 Kafka</option>
              </select>
            </div>

            {/* Frontend Host URL for POSTGRES */}
            {healthCheckMethod === 'POSTGRES' && (
              <div>
                <label className="block text-xs text-slate-300/80 mb-2 font-medium">
                  Frontend Host URL (Optional)
                  <span className="block text-xs text-slate-400/60 mt-1">
                    If specified, will use this host instead of the service host for connection
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.frontend_host_url || ''}
                  onChange={(e) => handleInputChange('frontend_host_url', e.target.value)}
                  placeholder="https://frontend.example.com"
                  className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 placeholder:text-slate-400/60"
                />
              </div>
            )}

            {/* Common Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300/80 mb-2 font-medium">Polling Interval (s)</label>
                <input
                  type="number"
                  value={formData.polling_interval || ''}
                  onChange={(e) => handleInputChange('polling_interval', e.target.value)}
                  className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300/80 mb-2 font-medium">Timeout (s)</label>
                <input
                  type="number"
                  value={formData.request_timeout || ''}
                  onChange={(e) => handleInputChange('request_timeout', e.target.value)}
                  className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40"
                />
              </div>
            </div>

            {/* HTTP/HTTPS Specific Settings */}
            {(healthCheckMethod === 'HTTP' || healthCheckMethod === 'HTTPS') && (
              <>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">URL Path</label>
                  <input
                    type="text"
                    value={formData.healthcheck_url || ''}
                    onChange={(e) => handleInputChange('healthcheck_url', e.target.value)}
                    placeholder="/health"
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 placeholder:text-slate-400/60"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300/80 mb-2 font-medium">HTTP Method</label>
                    <select
                      value={formData.http_method || 'GET'}
                      onChange={(e) => handleInputChange('http_method', e.target.value)}
                      className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="HEAD">HEAD</option>
                      <option value="OPTIONS">OPTIONS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300/80 mb-2 font-medium">Expected Status</label>
                    <input
                      type="number"
                      value={formData.expected_status || ''}
                      onChange={(e) => handleInputChange('expected_status', e.target.value)}
                      placeholder="200"
                      className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">Headers (JSON)</label>
                  <textarea
                    value={formData.headers || ''}
                    onChange={(e) => handleInputChange('headers', e.target.value)}
                    rows={2}
                    placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 font-mono resize-none placeholder:text-slate-400/60"
                  />
                </div>
                {formData.http_method !== 'GET' && formData.http_method !== 'HEAD' && (
                  <div>
                    <label className="block text-xs text-slate-300/80 mb-2 font-medium">Request Body</label>
                    <textarea
                      value={formData.body || ''}
                      onChange={(e) => handleInputChange('body', e.target.value)}
                      rows={2}
                      placeholder='{"ping": "health-check"}'
                      className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 font-mono resize-none placeholder:text-slate-400/60"
                    />
                  </div>
                )}
                {healthCheckMethod === 'HTTPS' && (
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ssl_verify}
                        onChange={(e) => handleInputChange('ssl_verify', e.target.checked)}
                        className="w-4 h-4 text-emerald-500 bg-slate-700 border-emerald-500/30 rounded focus:ring-emerald-400/20 focus:ring-2"
                      />
                      <span className="text-xs text-slate-300/80">Verify SSL Certificate</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.follow_redirects}
                        onChange={(e) => handleInputChange('follow_redirects', e.target.checked)}
                        className="w-4 h-4 text-emerald-500 bg-slate-700 border-emerald-500/30 rounded focus:ring-emerald-400/20 focus:ring-2"
                      />
                      <span className="text-xs text-slate-300/80">Follow Redirects</span>
                    </label>
                  </div>
                )}
              </>
            )}

            {/* TCP Specific Settings */}
            {healthCheckMethod === 'TCP' && (
              <>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">Send Data (Optional)</label>
                  <input
                    type="text"
                    value={formData.tcp_send_data || ''}
                    onChange={(e) => handleInputChange('tcp_send_data', e.target.value)}
                    placeholder="PING\\r\\n"
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 placeholder:text-slate-400/60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">Expected Response (Optional)</label>
                  <input
                    type="text"
                    value={formData.tcp_expect_data || ''}
                    onChange={(e) => handleInputChange('tcp_expect_data', e.target.value)}
                    placeholder="PONG"
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 placeholder:text-slate-400/60"
                  />
                </div>
              </>
            )}

            {/* UDP Specific Settings */}
            {healthCheckMethod === 'UDP' && (
              <>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">Send Data</label>
                  <input
                    type="text"
                    value={formData.udp_send_data || ''}
                    onChange={(e) => handleInputChange('udp_send_data', e.target.value)}
                    placeholder="health-check"
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 placeholder:text-slate-400/60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">Expected Response</label>
                  <input
                    type="text"
                    value={formData.udp_expect_data || ''}
                    onChange={(e) => handleInputChange('udp_expect_data', e.target.value)}
                    placeholder="ok"
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 placeholder:text-slate-400/60"
                  />
                </div>
              </>
            )}

            {/* ICMP Specific Settings */}
            {healthCheckMethod === 'ICMP' && (
              <div>
                <label className="block text-xs text-slate-300/80 mb-2 font-medium">Packet Count</label>
                <input
                  type="number"
                  value={formData.icmp_packet_count || ''}
                  onChange={(e) => handleInputChange('icmp_packet_count', e.target.value)}
                  placeholder="3"
                  min="1"
                  max="10"
                  className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40"
                />
              </div>
            )}

            {/* DNS Specific Settings */}
            {healthCheckMethod === 'DNS' && (
              <>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">Query Type</label>
                  <select
                    value={formData.dns_query_type || 'A'}
                    onChange={(e) => handleInputChange('dns_query_type', e.target.value)}
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40"
                  >
                    <option value="A">A Record</option>
                    <option value="AAAA">AAAA Record</option>
                    <option value="CNAME">CNAME Record</option>
                    <option value="MX">MX Record</option>
                    <option value="TXT">TXT Record</option>
                    <option value="NS">NS Record</option>
                    <option value="SOA">SOA Record</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">Expected Result (Optional)</label>
                  <input
                    type="text"
                    value={formData.dns_expected_result || ''}
                    onChange={(e) => handleInputChange('dns_expected_result', e.target.value)}
                    placeholder="192.168.1.1"
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 placeholder:text-slate-400/60"
                  />
                </div>
              </>
            )}

            {/* Kafka Specific Settings */}
            {healthCheckMethod === 'KAFKA' && (
              <>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">Topic (Optional)</label>
                  <input
                    type="text"
                    value={formData.kafka_topic || ''}
                    onChange={(e) => handleInputChange('kafka_topic', e.target.value)}
                    placeholder="healthcheck-topic"
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 placeholder:text-slate-400/60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300/80 mb-2 font-medium">Client ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.kafka_client_id || ''}
                    onChange={(e) => handleInputChange('kafka_client_id', e.target.value)}
                    placeholder="service-weaver-healthcheck"
                    className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 placeholder:text-slate-400/60"
                  />
                </div>
              </>
            )}

            {/* Status Code Mapping for HTTP/HTTPS */}
            {(healthCheckMethod === 'HTTP' || healthCheckMethod === 'HTTPS') && (
              <div>
                <label className="block text-xs text-slate-300/80 mb-2 font-medium">Status Code Mapping (JSON)</label>
                <textarea
                  value={statusMapping}
                  onChange={(e) => setStatusMapping(e.target.value)}
                  rows={3}
                  placeholder='{"200": "alive", "429": "degraded", "500": "dead"}'
                  className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 font-mono resize-none placeholder:text-slate-400/60"
                />
                <p className="text-xs text-slate-400/70 mt-2 italic">
                  💡 Map HTTP status codes to service states
                </p>
              </div>
            )}

            {/* Method-specific help text */}
            <div className="bg-slate-800/40 rounded-lg p-3 border border-emerald-500/10">
              <p className="text-xs text-slate-400/80 italic">
                {healthCheckMethod === 'HTTP' && '🌐 Performs HTTP requests to check service health'}
                {healthCheckMethod === 'HTTPS' && '🔒 Performs secure HTTPS requests with SSL verification'}
                {healthCheckMethod === 'TCP' && '🔌 Tests TCP connection and optionally exchanges data'}
                {healthCheckMethod === 'UDP' && '📡 Sends UDP packets and waits for response'}
                {healthCheckMethod === 'ICMP' && '📶 Sends ICMP ping packets to test connectivity'}
                {healthCheckMethod === 'DNS' && '🌍 Performs DNS queries to verify resolution'}
                {healthCheckMethod === 'WEBSOCKET' && '⚡ Establishes WebSocket connection for real-time checks'}
                {healthCheckMethod === 'WSS' && '🔒 Establishes secure WebSocket connection with SSL verification'}
                {healthCheckMethod === 'GRPC' && '🚀 Performs gRPC health checks using standard protocol'}
                {healthCheckMethod === 'SMTP' && '📧 Tests SMTP server connectivity and authentication'}
                {healthCheckMethod === 'FTP' && '📁 Verifies FTP server connection and login'}
                {healthCheckMethod === 'SSH' && '🔐 Tests SSH connectivity and authentication'}
                {healthCheckMethod === 'REDIS' && '🔴 Performs Redis PING command'}
                {healthCheckMethod === 'MYSQL' && '🐬 Executes MySQL health check query'}
                {healthCheckMethod === 'POSTGRES' && '🐘 Runs PostgreSQL health check query'}
                {healthCheckMethod === 'MONGODB' && '🍃 Performs MongoDB ping operation'}
                {healthCheckMethod === 'KAFKA' && '📨 Connects to Kafka broker and verifies topic availability'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gradient-to-r from-cyan-500/20 via-purple-500/30 to-pink-500/20 flex space-x-3 relative z-10">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600/90 via-green-500/90 to-emerald-600/90 hover:from-emerald-500 hover:via-green-400 hover:to-emerald-500 text-white py-3 px-6 rounded-xl transition-all duration-300 backdrop-blur-sm border border-emerald-400/30 hover:border-emerald-300/50 hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(16,185,129,0.4)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Save size={18} className="relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" />
          <span className="relative z-10 font-medium">Save Changes</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600/90 via-pink-500/90 to-red-600/90 hover:from-red-500 hover:via-pink-400 hover:to-red-500 text-white py-3 px-4 rounded-xl transition-all duration-300 backdrop-blur-sm border border-red-400/30 hover:border-red-300/50 hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(239,68,68,0.4)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Trash2 size={18} className="relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" />
        </button>
      </div>
    </div>
  );
};

export default InspectorPanel;
