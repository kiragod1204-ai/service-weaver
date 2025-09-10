import { create } from 'zustand';
import axios from 'axios';

// Get API base URL from environment variables or use default
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080/api';
const WS_BASE = process.env.REACT_APP_WS_BASE || `ws://${window.location.hostname}:8080`;

const useStore = create((set, get) => {
  // Initialize token from localStorage and set axios default header
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return {
    // State
    // Auth state
    user: null,
    token: token,
    isAuthenticated: !!token,
    success: null,
    
    // Diagram state
    diagrams: [],
    currentDiagram: null,
    services: [],
    connections: [],
    selectedService: null,
    copiedService: null, // For copy/paste functionality
    isLoading: false,
    error: null,
    websocket: null,

    // Actions
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    
    // Authentication actions
    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/login`, {
          username: credentials.username,
          password: credentials.password,
          remember_me: credentials.rememberMe || false
        });
        const { token, user } = response.data;
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set axios default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isLoading: false,
          success: 'Successfully logged in!' 
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          set({ success: null });
        }, 3000);
        
        return user;
      } catch (error) {
        let errorMessage = 'Login failed';
        
        if (error.response) {
          // Server responded with error status
          switch (error.response.status) {
            case 400:
              errorMessage = 'Invalid username or password';
              break;
            case 401:
              errorMessage = 'Invalid credentials';
              break;
            case 429:
              errorMessage = 'Too many login attempts. Please try again later.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.response.data?.error || 'Login failed';
          }
        } else if (error.request) {
          // Request made but no response received
          errorMessage = 'Network error. Please check your connection.';
        } else {
          // Something else happened
          errorMessage = error.message || 'An unexpected error occurred';
        }
        
        set({ 
          error: errorMessage, 
          isLoading: false 
        });
        throw error;
      }
    },

    // First-run admin setup
    createFirstRunAdmin: async (adminData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/first-run-admin`, {
          username: adminData.username,
          password: adminData.password,
          email: adminData.email
        });
        const { token, user, message } = response.data;
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set axios default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isLoading: false,
          success: message || 'Admin account created successfully!' 
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          set({ success: null });
        }, 3000);
        
        return user;
      } catch (error) {
        let errorMessage = 'Failed to create admin account';
        
        if (error.response) {
          // Server responded with error status
          switch (error.response.status) {
            case 400:
              errorMessage = error.response.data?.error || 'Invalid admin data';
              break;
            case 409:
              errorMessage = 'Admin account already exists';
              break;
            case 422:
              errorMessage = 'Invalid email format or missing required fields';
              break;
            case 429:
              errorMessage = 'Too many attempts. Please try again later.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.response.data?.error || 'Failed to create admin account';
          }
        } else if (error.request) {
          // Request made but no response received
          errorMessage = 'Network error. Please check your connection.';
        } else {
          // Something else happened
          errorMessage = error.message || 'An unexpected error occurred';
        }
        
        set({ 
          error: errorMessage, 
          isLoading: false 
        });
        throw error;
      }
    },
    
    register: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/register`, userData);
        const { token, user } = response.data;
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set axios default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isLoading: false,
          success: 'Account created successfully!' 
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          set({ success: null });
        }, 3000);
        
        return user;
      } catch (error) {
        let errorMessage = 'Registration failed';
        
        if (error.response) {
          // Server responded with error status
          switch (error.response.status) {
            case 400:
              errorMessage = error.response.data?.error || 'Invalid registration data';
              break;
            case 409:
              errorMessage = 'Username already exists';
              break;
            case 422:
              errorMessage = 'Invalid email format or missing required fields';
              break;
            case 429:
              errorMessage = 'Too many registration attempts. Please try again later.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.response.data?.error || 'Registration failed';
          }
        } else if (error.request) {
          // Request made but no response received
          errorMessage = 'Network error. Please check your connection.';
        } else {
          // Something else happened
          errorMessage = error.message || 'An unexpected error occurred';
        }
        
        set({ 
          error: errorMessage, 
          isLoading: false 
        });
        throw error;
      }
    },
    
    logout: () => {
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      // Remove axios default header
      delete axios.defaults.headers.common['Authorization'];
      
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        currentDiagram: null,
        services: [],
        connections: [],
        selectedService: null,
        success: 'Successfully logged out!',
        error: null
      });
      
      // Clear success message after 2 seconds
      setTimeout(() => {
        set({ success: null });
      }, 2000);
    },
    
    // Initialize authentication state from localStorage
    initAuth: async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          // Fetch user data from the backend
          const response = await axios.get(`${API_BASE}/user/me`);
          set({ 
            token, 
            isAuthenticated: true,
            user: response.data
          });
        } catch (error) {
          // If token is invalid, clear it
          console.error('Failed to fetch user data:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          set({ 
            token: null, 
            isAuthenticated: false,
            user: null,
            error: 'Session expired. Please log in again.'
          });
        }
      }
    },

    // User management methods (admin only)
    createUser: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/users`, userData);
        set({ isLoading: false });
        return response.data;
      } catch (error) {
        let errorMessage = 'Failed to create user';
        
        if (error.response) {
          switch (error.response.status) {
            case 400:
              errorMessage = error.response.data?.error || 'Invalid user data';
              break;
            case 401:
              errorMessage = 'Unauthorized access';
              break;
            case 403:
              errorMessage = 'Admin privileges required';
              break;
            case 409:
              errorMessage = 'Username already exists';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.response.data?.error || 'Failed to create user';
          }
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message || 'An unexpected error occurred';
        }
        
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    getUsers: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get(`${API_BASE}/users`);
        set({ isLoading: false });
        return response.data;
      } catch (error) {
        let errorMessage = 'Failed to fetch users';
        
        if (error.response) {
          switch (error.response.status) {
            case 401:
              errorMessage = 'Unauthorized access';
              break;
            case 403:
              errorMessage = 'Admin privileges required';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.response.data?.error || 'Failed to fetch users';
          }
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message || 'An unexpected error occurred';
        }
        
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    updateUser: async (userId, userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/users/${userId}`, userData);
        set({ isLoading: false });
        return response.data;
      } catch (error) {
        let errorMessage = 'Failed to update user';
        
        if (error.response) {
          switch (error.response.status) {
            case 400:
              errorMessage = error.response.data?.error || 'Invalid user data';
              break;
            case 401:
              errorMessage = 'Unauthorized access';
              break;
            case 403:
              errorMessage = 'Admin privileges required';
              break;
            case 404:
              errorMessage = 'User not found';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.response.data?.error || 'Failed to update user';
          }
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message || 'An unexpected error occurred';
        }
        
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    deleteUser: async (userId) => {
      set({ isLoading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/users/${userId}`);
        set({ isLoading: false });
        return true;
      } catch (error) {
        let errorMessage = 'Failed to delete user';
        
        if (error.response) {
          switch (error.response.status) {
            case 400:
              errorMessage = error.response.data?.error || 'Cannot delete user';
              break;
            case 401:
              errorMessage = 'Unauthorized access';
              break;
            case 403:
              errorMessage = 'Admin privileges required';
              break;
            case 404:
              errorMessage = 'User not found';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.response.data?.error || 'Failed to delete user';
          }
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message || 'An unexpected error occurred';
        }
        
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },
    
    // WebSocket connection
    connectWebSocket: () => {
      const ws = new WebSocket(`${WS_BASE}/ws`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const update = JSON.parse(event.data);
        const { services } = get();
        
        // Handle both snake_case (from JSON) and PascalCase (from Go struct) field names
        const serviceId = update.service_id || update.ServiceID;
        const status = update.status || update.Status;
        
        const updatedServices = (services || []).map(service =>
          service.id === serviceId
            ? { ...service, current_status: status }
            : service
        );
        
        set({ services: updatedServices });
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Reconnect after 3 seconds
        setTimeout(() => {
          get().connectWebSocket();
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      set({ websocket: ws });
    },

    // Diagram operations
    fetchDiagrams: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get(`${API_BASE}/diagrams`);
        set({ diagrams: response.data, isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    createDiagram: async (diagram) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/diagrams`, diagram);
        const { diagrams } = get();
        set({ 
          diagrams: [response.data, ...diagrams], 
          isLoading: false 
        });
        return response.data;
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },

    loadDiagram: async (diagramId) => {
      set({ isLoading: true, error: null });
      try {
        // Fetch diagram, services, and connections in parallel
        const [diagramResponse, servicesResponse, connectionsResponse] = await Promise.all([
          axios.get(`${API_BASE}/diagrams/${diagramId}`),
          axios.get(`${API_BASE}/services/diagram/${diagramId}`),
          axios.get(`${API_BASE}/connections/diagram/${diagramId}`)
        ]);
        
        // Handle the nested response structure from the backend
        const diagramData = diagramResponse.data.diagram || diagramResponse.data;
        
        set({
          currentDiagram: diagramData,
          services: servicesResponse.data || [],
          connections: connectionsResponse.data || [],
          isLoading: false
        });
        
        console.log('Diagram loaded:', diagramData);
        console.log('Services loaded:', servicesResponse.data);
        console.log('Connections loaded:', connectionsResponse.data);
      } catch (error) {
        console.error('Failed to load diagram:', error);
        set({ error: error.message, isLoading: false });
      }
    },

    loadDiagramPublic: async (diagramId) => {
      set({ isLoading: true, error: null });
      try {
        // Create axios instance without authorization header for public access
        const publicAxios = axios.create();
        
        // Fetch diagram, services, and connections in parallel without authentication
        const [diagramResponse, servicesResponse, connectionsResponse] = await Promise.all([
          publicAxios.get(`${API_BASE}/diagrams/${diagramId}`),
          publicAxios.get(`${API_BASE}/services/diagram/${diagramId}`),
          publicAxios.get(`${API_BASE}/connections/diagram/${diagramId}`)
        ]);
        
        // Handle the nested response structure from the backend
        const diagramData = diagramResponse.data.diagram || diagramResponse.data;
        
        set({
          currentDiagram: diagramData,
          services: servicesResponse.data || [],
          connections: connectionsResponse.data || [],
          isLoading: false
        });
        
        console.log('Public diagram loaded:', diagramData);
        console.log('Services loaded:', servicesResponse.data);
        console.log('Connections loaded:', connectionsResponse.data);
      } catch (error) {
        console.error('Failed to load public diagram:', error);
        set({ error: error.message, isLoading: false });
      }
    },

    updateDiagram: async (diagram) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/diagrams/${diagram.id}`, diagram);
        const { diagrams, currentDiagram } = get();
        const updatedDiagrams = diagrams.map(d =>
          d.id === diagram.id ? response.data : d
        );
        set({
          diagrams: updatedDiagrams,
          currentDiagram: currentDiagram?.id === diagram.id ? response.data : currentDiagram,
          isLoading: false
        });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    deleteDiagram: async (diagramId) => {
      set({ isLoading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/diagrams/${diagramId}`);
        const { diagrams, currentDiagram } = get();
        set({
          diagrams: diagrams.filter(d => d.id !== diagramId),
          currentDiagram: currentDiagram?.id === diagramId ? null : currentDiagram,
          services: currentDiagram?.id === diagramId ? [] : get().services,
          connections: currentDiagram?.id === diagramId ? [] : get().connections,
          isLoading: false
        });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    // Service operations
    createService: async (service) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/services`, service);
        const { services } = get();
        set({ 
          services: [...services, response.data], 
          isLoading: false 
        });
        return response.data;
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },

    updateService: async (service) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/services/${service.id}`, service);
        const { services } = get();
        const updatedServices = services.map(s => 
          s.id === service.id ? response.data : s
        );
        set({ 
          services: updatedServices, 
          selectedService: response.data,
          isLoading: false 
        });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    updateServiceIcon: async (serviceId, iconData) => {
      set({ isLoading: true, error: null });
      try {
        const formData = new FormData();
        formData.append('icon', iconData);
        
        const response = await axios.post(`${API_BASE}/services/${serviceId}/icon`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        const { services } = get();
        const updatedServices = services.map(s => 
          s.id === serviceId ? { ...s, icon: response.data.icon } : s
        );
        
        set({ 
          services: updatedServices, 
          selectedService: updatedServices.find(s => s.id === serviceId),
          isLoading: false 
        });
        
        return response.data;
      } catch (error) {
        let errorMessage = 'Failed to upload icon';
        
        if (error.response) {
          switch (error.response.status) {
            case 400:
              errorMessage = error.response.data?.error || 'Invalid file format or size';
              break;
            case 401:
              errorMessage = 'Unauthorized access';
              break;
            case 404:
              errorMessage = 'Service not found';
              break;
            case 413:
              errorMessage = 'File size exceeds limit';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = error.response.data?.error || 'Failed to upload icon';
          }
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message || 'An unexpected error occurred';
        }
        
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    deleteService: async (serviceId) => {
      set({ isLoading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/services/${serviceId}`);
        const { services, connections } = get();
        const updatedServices = services.filter(s => s.id !== serviceId);
        const updatedConnections = connections.filter(c => 
          c.source_id !== serviceId && c.target_id !== serviceId
        );
        set({ 
          services: updatedServices,
          connections: updatedConnections,
          selectedService: null,
          isLoading: false 
        });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    // Connection operations
    createConnection: async (connection) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE}/connections`, connection);
        const { connections } = get();
        set({ 
          connections: [...connections, response.data], 
          isLoading: false 
        });
        return response.data;
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },

    deleteConnection: async (connectionId) => {
      set({ isLoading: true, error: null });
      try {
        await axios.delete(`${API_BASE}/connections/${connectionId}`);
        const { connections } = get();
        set({ 
          connections: connections.filter(c => c.id !== connectionId),
          isLoading: false 
        });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    updateConnection: async (connection) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.put(`${API_BASE}/connections/${connection.id}`, connection);
        const { connections } = get();
        const updatedConnections = connections.map(c => 
          c.id === connection.id ? response.data : c
        );
        set({ 
          connections: updatedConnections,
          isLoading: false 
        });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    // UI state
    setSelectedService: (service) => set({ selectedService: service }),
    setCopiedService: (service) => set({ copiedService: service }),

    // Copy/Paste functionality
    pasteService: async () => {
      const { copiedService, currentDiagram, createService } = get();
      if (!copiedService || !currentDiagram) {
        console.error('No service copied or no diagram loaded');
        return;
      }

      // Offset the position for the new service
      const newPosition = {
        x: copiedService.position_x + 50, // Offset by 50px
        y: copiedService.position_y + 50, // Offset by 50px
      };

      // Create a new service object based on the copied one
      const newServiceData = {
        diagram_id: currentDiagram.id,
        name: `${copiedService.name} (Copy)`,
        description: copiedService.description,
        service_type: copiedService.service_type,
        icon: copiedService.icon,
        host: copiedService.host,
        port: copiedService.port,
        tags: copiedService.tags,
        position_x: newPosition.x,
        position_y: newPosition.y,
        healthcheck_url: copiedService.healthcheck_url,
        polling_interval: copiedService.polling_interval,
        request_timeout: copiedService.request_timeout,
        expected_status: copiedService.expected_status,
        status_mapping: copiedService.status_mapping,
      };

      try {
        const newService = await createService(newServiceData);
        set({ selectedService: newService }); // Select the newly pasted service
        return newService;
      } catch (error) {
        console.error('Failed to paste service:', error);
        set({ error: 'Failed to paste service. Please try again.' });
        throw error;
      }
    },
    
    updateServicePosition: (serviceId, position) => {
      const { services } = get();
      
      // Only update if the position has actually changed
      const service = services.find(s => s.id === serviceId);
      if (!service || (service.position_x === position.x && service.position_y === position.y)) {
        return; // No change needed
      }
      
      const updatedServices = services.map(service => 
        service.id === serviceId 
          ? { ...service, position_x: position.x, position_y: position.y }
          : service
      );
      
      // Only update state if there are actual changes
      set({ services: updatedServices });
      
      // Auto-save positions to localStorage
      try {
        localStorage.setItem('diagram_positions', JSON.stringify({
          services: updatedServices.map(s => ({
            id: s.id,
            position_x: s.position_x,
            position_y: s.position_y
          })),
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Failed to save positions to localStorage:', error);
      }
    },

    // Load positions from localStorage
    loadPositionsFromStorage: () => {
      try {
        const stored = localStorage.getItem('diagram_positions');
        if (stored) {
          const { services: storedServices, timestamp } = JSON.parse(stored);
          // Only load if less than 24 hours old
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            const { services } = get();
            const updatedServices = services.map(service => {
              const storedService = storedServices.find(s => s.id === service.id);
              if (!storedService) return service;
              
              // Only update if position has actually changed
              if (service.position_x === storedService.position_x && 
                  service.position_y === storedService.position_y) {
                return service;
              }
              
              return { 
                ...service, 
                position_x: storedService.position_x, 
                position_y: storedService.position_y 
              };
            });
            
            // Only update state if there are actual changes
            const hasChanges = updatedServices.some((updatedService, index) => 
              updatedService.position_x !== services[index].position_x ||
              updatedService.position_y !== services[index].position_y
            );
            
            if (hasChanges) {
              set({ services: updatedServices });
            }
            return true;
          }
        }
      } catch (error) {
        console.error('Failed to load positions from localStorage:', error);
      }
      return false;
    },

    // Save positions to backend
    savePositionsToBackend: async () => {
      const { services, currentDiagram } = get();
      if (!currentDiagram) return;
      
      set({ isLoading: true, error: null });
      try {
        const positions = services.map(service => ({
          service_id: service.id,
          position_x: service.position_x,
          position_y: service.position_y
        }));
        
        await axios.post(`${API_BASE}/diagrams/${currentDiagram.id}/positions`, { positions });
        set({ isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    // Load positions from backend
    loadPositionsFromBackend: async () => {
      const { currentDiagram } = get();
      if (!currentDiagram) return;
      
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get(`${API_BASE}/diagrams/${currentDiagram.id}/positions`);
        const { services } = get();
        const updatedServices = services.map(service => {
          const position = response.data.find(p => p.service_id === service.id);
          return position 
            ? { ...service, position_x: position.position_x, position_y: position.position_y }
            : service;
        });
        set({ services: updatedServices, isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },
  };
});

export default useStore;
