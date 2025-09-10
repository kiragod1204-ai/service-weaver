import React, { useState, useMemo } from 'react';
import { Trash2, Edit2, Search, Calendar, FileText } from 'lucide-react';
import useStore from '../store/useStore';

const DiagramSelector = ({ onDiagramSelect }) => {
  const {
    diagrams,
    currentDiagram,
    deleteDiagram,
    updateDiagram
  } = useStore();
  
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'name', 'description', 'date'

  const handleSelectDiagram = (diagram) => {
    onDiagramSelect(diagram.id);
  };

  const handleEditStart = (diagram, e) => {
    e.stopPropagation();
    setEditingId(diagram.id);
    setEditName(diagram.name);
  };

  const handleEditSave = async (diagram, e) => {
    e.stopPropagation();
    if (editName.trim()) {
      try {
        await updateDiagram({
          ...diagram,
          name: editName.trim()
        });
      } catch (error) {
        console.error('Failed to update diagram:', error);
        // Optionally show an error message to the user
      }
    }
    setEditingId(null);
  };

  const handleEditCancel = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (diagram, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${diagram.name}"?`)) {
      try {
        await deleteDiagram(diagram.id);
        // The store now handles clearing the current diagram if it was deleted
      } catch (error) {
        console.error('Failed to delete diagram:', error);
        // Optionally show an error message to the user
      }
    }
  };

  // Filter and search diagrams
  const filteredDiagrams = useMemo(() => {
    if (!diagrams || diagrams.length === 0) return [];
    
    return diagrams.filter(diagram => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = diagram.name.toLowerCase().includes(searchLower);
        const matchesDescription = diagram.description?.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesDescription) return false;
      }
      
      // Apply additional filter
      if (filterBy !== 'all') {
        if (filterBy === 'name' && !diagram.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        if (filterBy === 'description' && !diagram.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        // For date filter, we could implement more complex logic like filtering by date range
      }
      
      return true;
    });
  }, [diagrams, searchTerm, filterBy]);

  if (!diagrams || diagrams.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <div className="text-slate-400 text-lg mb-2">No diagrams available</div>
        <div className="text-slate-500 text-sm">Create your first diagram to get started</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Diagrams</h2>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search diagrams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterBy('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterBy === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterBy('name')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                filterBy === 'name'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <FileText size={14} />
              Name
            </button>
            <button
              onClick={() => setFilterBy('description')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                filterBy === 'description'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <FileText size={14} />
              Description
            </button>
            <button
              onClick={() => setFilterBy('date')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                filterBy === 'date'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Calendar size={14} />
              Date
            </button>
          </div>
        </div>
        
        {/* Results count */}
        <div className="text-slate-400 text-sm mb-4">
          Showing {filteredDiagrams.length} of {diagrams.length} diagrams
          {currentDiagram && (
            <span className="ml-2 text-green-400">
              • Current: {currentDiagram.name}
            </span>
          )}
        </div>
      </div>
      
      {/* Diagram List */}
      <div className="space-y-3">
        {filteredDiagrams.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No diagrams match your search criteria
          </div>
        ) : (
          filteredDiagrams.map((diagram) => (
            <div
              key={diagram.id}
              className={`
                flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors
                ${currentDiagram?.id === diagram.id
                  ? 'bg-green-900/30 border border-green-700'
                  : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600'
                }
              `}
              onClick={() => handleSelectDiagram(diagram)}
            >
              <div className="flex-1 min-w-0">
                {editingId === diagram.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={(e) => handleEditSave(diagram, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEditSave(diagram, e);
                      } else if (e.key === 'Escape') {
                        handleEditCancel(e);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-slate-800 border border-slate-500 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    autoFocus
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-white truncate">
                        {diagram.name}
                      </div>
                      {currentDiagram?.id === diagram.id && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-slate-300 text-sm truncate mb-1">
                      {diagram.description || 'No description'}
                    </div>
                    <div className="text-slate-400 text-xs">
                      Updated {new Date(diagram.updated_at).toLocaleDateString()}
                    </div>
                  </>
                )}
              </div>
              
              {editingId !== diagram.id && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => handleEditStart(diagram, e)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-slate-300 hover:text-white"
                    title="Rename diagram"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(diagram, e)}
                    className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-slate-300 hover:text-red-400"
                    title="Delete diagram"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DiagramSelector;
