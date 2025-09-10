import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import useStore from './store/useStore';
import DiagramCanvas from './components/DiagramCanvas';
import MonitoringCanvas from './components/MonitoringCanvas';
import Sidebar from './components/Sidebar';
import InspectorPanel from './components/InspectorPanel';
import DiagramSelector from './components/DiagramSelector';
import LoginForm from './components/LoginForm';
import UsersManager from './components/UsersManager';
import { Plus, Monitor, Users, LogOut, ChevronUp, ArrowLeft } from 'lucide-react';

// Monitoring view component wrapper
const MonitoringView = () => {
  const { diagramId } = useParams();
  const { diagrams, loadDiagramPublic } = useStore();
  
  useEffect(() => {
    if (diagramId) {
      loadDiagramPublic(parseInt(diagramId));
    }
  }, [diagramId, loadDiagramPublic]);

  const diagram = diagrams?.find(d => d.id === parseInt(diagramId));
  
  if (!diagram) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <h2 className="text-xl font-bold mb-2">Diagram Not Found</h2>
          <p>The requested diagram could not be found or is not public.</p>
          <Link to="/diagrams" className="text-neon-blue hover:underline mt-4 inline-block">Back to Diagrams</Link>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex relative overflow-hidden">
        {/* Sidebar is hidden on Monitoring View */}
        <div className="flex-1">
          <MonitoringCanvas diagramId={parseInt(diagramId)} />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

// Diagram List View Component
const DiagramListView = () => {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDiagramName, setNewDiagramName] = useState('');
  const { createDiagram, isLoading } = useStore();

  const handleCreateDiagram = async (e) => {
    e.preventDefault();
    if (!newDiagramName.trim()) return;
    
    try {
      const diagram = await createDiagram({
        name: newDiagramName,
        description: ''
      });
      setNewDiagramName('');
      setShowCreateDialog(false);
      navigate(`/diagrams/${diagram.id}/edit`);
    } catch (err) {
      console.error('Failed to create diagram:', err);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-blue/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="bg-dark-800/80 backdrop-blur-glass border-b border-neon-green/20 p-4 flex items-center justify-between relative">
          <div className="absolute inset-0 bg-gradient-glass opacity-50"></div>
          
          <div className="flex items-center space-x-4 relative z-10">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
              Service Weaver
            </h1>
          </div>
          
          <div className="flex items-center space-x-4 relative z-10">
            {/* User info */}
            <div className="flex items-center space-x-3 bg-dark-700/50 backdrop-blur-glass border border-slate-600/30 rounded-xl px-4 py-2">
              <div className="text-slate-300">
                <span className="text-slate-500 text-sm">Welcome,</span> {user?.username || 'User'}
              </div>
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
            </div>
            
            {/* Users Management button (admin only) */}
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className="flex items-center space-x-2 bg-dark-700/50 hover:bg-dark-600/50 border border-slate-600/30 hover:border-slate-500/50 text-slate-300 hover:text-white px-4 py-3 rounded-xl transition-all duration-300"
                title="Manage Users"
              >
                <Users size={16} />
                <span>Users</span>
              </Link>
            )}
            
            {/* New Diagram button */}
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-dark-900 font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-neon-green hover:shadow-neon-green"
            >
              <Plus size={16} />
              <span>New Diagram</span>
            </button>
            
            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-dark-700/50 hover:bg-dark-600/50 border border-slate-600/30 hover:border-slate-500/50 text-slate-300 hover:text-white px-4 py-3 rounded-xl transition-all duration-300"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-blue bg-clip-text text-transparent">
                Your Diagrams
              </h2>
              <p className="text-slate-300 max-w-2xl mx-auto">
                Select a diagram to edit or create a new one to get started with your system architecture design.
              </p>
            </div>
            
            <DiagramSelector onDiagramSelect={(diagramId) => navigate(`/diagrams/${diagramId}/edit`)} />
          </div>
        </div>
      </div>

      {/* Create Diagram Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-800/90 backdrop-blur-glass border border-neon-green/30 rounded-2xl p-8 w-96 shadow-glass-strong relative overflow-hidden animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 via-neon-blue/20 to-neon-purple/20 rounded-2xl blur-sm animate-gradient-shift bg-[length:200%_200%]"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                Create New Diagram
              </h3>
              <form onSubmit={handleCreateDiagram}>
                <input
                  type="text"
                  placeholder="Enter diagram name..."
                  value={newDiagramName}
                  onChange={(e) => setNewDiagramName(e.target.value)}
                  className="w-full bg-dark-700/80 border border-neon-green/30 rounded-xl px-4 py-3 mb-6 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green focus:shadow-neon-green/50 transition-all duration-300"
                  autoFocus
                />
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={!newDiagramName.trim() || isLoading}
                    className="flex-1 bg-gradient-to-r from-neon-green to-neon-cyan hover:from-neon-cyan hover:to-neon-blue disabled:from-dark-600 disabled:to-dark-500 text-dark-900 disabled:text-slate-400 font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-neon-green hover:shadow-neon-cyan"
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewDiagramName('');
                    }}
                    className="flex-1 bg-dark-600/80 hover:bg-dark-500/80 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold py-3 rounded-xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Diagram Editor View Component
const DiagramEditorView = () => {
  const { diagramId } = useParams();
  const { currentDiagram, loadDiagram, user, logout, selectedService } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (diagramId) {
      loadDiagram(parseInt(diagramId));
    }
  }, [diagramId, loadDiagram]);

  if (!currentDiagram || currentDiagram.id !== parseInt(diagramId)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <h2 className="text-xl font-bold mb-2">Loading Diagram...</h2>
          {currentDiagram && currentDiagram.id !== parseInt(diagramId) && <p>Redirecting...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-blue/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="bg-dark-800/80 backdrop-blur-glass border-b border-neon-green/20 p-4 flex items-center justify-between relative">
          <div className="absolute inset-0 bg-gradient-glass opacity-50"></div>
          
          <div className="flex items-center space-x-4 relative z-10">
            <button
              onClick={() => navigate('/diagrams')}
              className="flex items-center space-x-1 bg-dark-700/50 hover:bg-dark-600/50 border border-slate-600/30 hover:border-slate-500/50 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-300 text-sm"
              title="Back to Diagrams"
            >
              <ArrowLeft size={14} />
              <span>Diagrams</span>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
              Service Weaver
            </h1>
            {currentDiagram && (
              <div className="flex items-center space-x-3">
                <div className="text-slate-300">
                  <span className="text-slate-500">Current Diagram:</span> {currentDiagram.name}
                </div>
                {/* Monitoring button */}
                <a
                  href={`/monitor/${currentDiagram.id}`} // Keep as href for full page load if needed, or use Link
                  className="flex items-center space-x-1 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/30 hover:border-neon-blue/50 text-neon-blue hover:text-neon-cyan px-3 py-1.5 rounded-lg transition-all duration-300 text-sm"
                  title="Open in monitoring view"
                >
                  <Monitor size={14} />
                  <span>Monitor</span>
                </a>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4 relative z-10">
            {/* User info */}
            <div className="flex items-center space-x-3 bg-dark-700/50 backdrop-blur-glass border border-slate-600/30 rounded-xl px-4 py-2">
              <div className="text-slate-300">
                <span className="text-slate-500 text-sm">Welcome,</span> {user?.username || 'User'}
              </div>
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
            </div>
            
            {/* Users Management button (admin only) */}
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className="flex items-center space-x-2 bg-dark-700/50 hover:bg-dark-600/50 border border-slate-600/30 hover:border-slate-500/50 text-slate-300 hover:text-white px-4 py-3 rounded-xl transition-all duration-300"
                title="Manage Users"
              >
                <Users size={16} />
                <span>Users</span>
              </Link>
            )}
            
            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-dark-700/50 hover:bg-dark-600/50 border border-slate-600/30 hover:border-slate-500/50 text-slate-300 hover:text-white px-4 py-3 rounded-xl transition-all duration-300"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 flex">
          {/* Diagram Canvas */}
          <div className="flex-1">
            <DiagramCanvas />
          </div>
          
          {/* Inspector Panel - Conditionally Rendered */}
          {selectedService && <InspectorPanel />}
        </div>
      </div>
    </div>
  );
};

// Users Management View Component
const UsersManagementView = () => {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-blue/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="bg-dark-800/80 backdrop-blur-glass border-b border-neon-green/20 p-4 flex items-center justify-between relative">
          <div className="absolute inset-0 bg-gradient-glass opacity-50"></div>
          
          <div className="flex items-center space-x-4 relative z-10">
            <button
              onClick={() => navigate('/diagrams')}
              className="flex items-center space-x-1 bg-dark-700/50 hover:bg-dark-600/50 border border-slate-600/30 hover:border-slate-500/50 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-300 text-sm"
              title="Back to Diagrams"
            >
              <ArrowLeft size={14} />
              <span>Diagrams</span>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
              Service Weaver
            </h1>
            <div className="flex items-center space-x-3">
              <div className="text-slate-300">
                <span className="text-slate-500">Managing:</span> Users
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 relative z-10">
            {/* User info */}
            <div className="flex items-center space-x-3 bg-dark-700/50 backdrop-blur-glass border border-slate-600/30 rounded-xl px-4 py-2">
              <div className="text-slate-300">
                <span className="text-slate-500 text-sm">Welcome,</span> {user?.username || 'User'}
              </div>
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
            </div>
            
            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-dark-700/50 hover:bg-dark-600/50 border border-slate-600/30 hover:border-slate-500/50 text-slate-300 hover:text-white px-4 py-3 rounded-xl transition-all duration-300"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <UsersManager />
        </div>
      </div>
    </div>
  );
};


function App() {
  const { 
    connectWebSocket, 
    fetchDiagrams,
    isAuthenticated,
    initAuth
  } = useStore();
  
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll event to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initialize authentication state
    const initializeAuth = async () => {
      await initAuth();
    };
    initializeAuth();
  }, [initAuth]);

  useEffect(() => {
    // Only connect WebSocket and fetch diagrams if authenticated
    if (isAuthenticated) {
      connectWebSocket();
      fetchDiagrams();
    }
  }, [isAuthenticated, connectWebSocket, fetchDiagrams]);

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-blue/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
              Service Weaver
            </h1>
            <p className="text-slate-300">
              Please log in to access your system architecture diagrams
            </p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DiagramListView />} />
        <Route path="/diagrams" element={<DiagramListView />} />
        <Route path="/diagrams/:diagramId/edit" element={<DiagramEditorView />} />
        <Route path="/users" element={<UsersManagementView />} />
        <Route path="/monitor/:diagramId" element={<MonitoringView />} />
      </Routes>
      
      {/* Scroll to Top Button - Global */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 p-3 bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-900 rounded-full shadow-lg hover:shadow-neon-blue transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-opacity-50"
          title="Scroll to top"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </Router>
  );
}

export default App;
