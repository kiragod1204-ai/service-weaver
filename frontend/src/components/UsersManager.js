import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Users, UserPlus, Edit2, Trash2, Shield, User as UserIcon } from 'lucide-react';

const UsersManager = () => {
  const { user, getUsers, updateUser, deleteUser, createUser, isLoading } = useStore();
  const [users, setUsers] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer'
  });
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch users when component mounts
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await getUsers();
        setUsers(userList);
      } catch (err) {
        // Error is already set in the store, but we can set a local one too if needed
        setLocalError(err.message || 'Failed to fetch users. Make sure you have admin privileges.');
      }
    };
    loadUsers();
  }, [getUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    try {
      const createdUser = await createUser(newUser);
      setSuccessMessage('User created successfully!');
      setNewUser({ username: '', email: '', password: '', role: 'viewer' });
      setShowCreateDialog(false);
      // Optimistically update the user list
      setUsers(prevUsers => [...prevUsers, createdUser]);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setLocalError(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    try {
      const updatedUserData = {
        ...editingUser,
        email: editingUser.email,
        role: editingUser.role
      };
      // Assuming updateUser returns the updated user object.
      // If not, we'll use updatedUserData for the optimistic update.
      const returnedUser = await updateUser(editingUser.id, updatedUserData);
      
      setSuccessMessage('User updated successfully!');
      setShowEditDialog(false);
      setEditingUser(null);
      // Optimistically update the user list
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === returnedUser.id ? returnedUser : u)
      );
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setLocalError(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    setLocalError('');
    
    try {
      await deleteUser(userId);
      setSuccessMessage('User deleted successfully!');
      // Optimistically update the user list
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setLocalError(err.message || 'Failed to delete user');
    }
  };

  const openEditDialog = (user) => {
    setEditingUser({ ...user });
    setShowEditDialog(true);
    setLocalError('');
  };

  const getRoleIcon = (role) => {
    return role === 'admin' ? <Shield size={16} className="text-neon-green" /> : <UserIcon size={16} className="text-neon-blue" />;
  };

  const getRoleColor = (role) => {
    return role === 'admin' 
      ? 'bg-neon-green/20 text-neon-green border-neon-green/30' 
      : 'bg-neon-blue/20 text-neon-blue border-neon-blue/30';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-blue bg-clip-text text-transparent">
            User Management
          </h2>
          <p className="text-slate-300">
            Manage users and their roles in the system
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-neon-green to-neon-cyan hover:from-neon-cyan hover:to-neon-blue text-dark-900 font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-neon-green hover:shadow-neon-cyan"
        >
          <UserPlus size={16} />
          <span>Add User</span>
        </button>
      </div>

      {/* Messages */}
      {localError && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300">
          {localError}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-500/50 rounded-xl text-green-300">
          {successMessage}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-dark-800/50 backdrop-blur-glass border border-slate-600/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700/50 border-b border-slate-600/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600/30">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-blue/20 flex items-center justify-center mr-3">
                        <UserIcon size={16} className="text-slate-300" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{u.username}</div>
                        {u.id === user?.id && (
                          <div className="text-xs text-neon-green">(You)</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(u.role)}`}>
                      {getRoleIcon(u.role)}
                      <span className="uppercase">{u.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditDialog(u)}
                        disabled={u.id === user?.id}
                        className={`p-2 rounded-lg transition-colors ${
                          u.id === user?.id 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-dark-600/50 text-slate-300 hover:text-white'
                        }`}
                        title={u.id === user?.id ? "Cannot edit your own account" : "Edit user"}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.id === user?.id}
                        className={`p-2 rounded-lg transition-colors ${
                          u.id === user?.id 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-red-600/50 text-slate-300 hover:text-red-400'
                        }`}
                        title={u.id === user?.id ? "Cannot delete your own account" : "Delete user"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No users found</h3>
            <p className="text-slate-500">Get started by adding your first user.</p>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-800/90 backdrop-blur-glass border border-neon-green/30 rounded-2xl p-8 w-96 shadow-glass-strong relative overflow-hidden animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 via-neon-blue/20 to-neon-purple/20 rounded-2xl blur-sm animate-gradient-shift bg-[length:200%_200%]"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                Create New User
              </h3>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full bg-dark-700/80 border border-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green focus:shadow-neon-green/50 transition-all duration-300"
                      placeholder="Enter username..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full bg-dark-700/80 border border-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green focus:shadow-neon-green/50 transition-all duration-300"
                      placeholder="Enter email..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full bg-dark-700/80 border border-neon-green/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green focus:shadow-neon-green/50 transition-all duration-300"
                      placeholder="Enter password..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full bg-dark-700/80 border border-neon-green/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green focus:shadow-neon-green/50 transition-all duration-300"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <button
                    type="submit"
                    disabled={isLoading || !newUser.username || !newUser.email || !newUser.password}
                    className="flex-1 bg-gradient-to-r from-neon-green to-neon-cyan hover:from-neon-cyan hover:to-neon-blue disabled:from-dark-600 disabled:to-dark-500 text-dark-900 disabled:text-slate-400 font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-neon-green hover:shadow-neon-cyan"
                  >
                    {isLoading ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewUser({ username: '', email: '', password: '', role: 'viewer' });
                      setLocalError('');
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

      {/* Edit User Dialog */}
      {showEditDialog && editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-800/90 backdrop-blur-glass border border-neon-blue/30 rounded-2xl p-8 w-96 shadow-glass-strong relative overflow-hidden animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 via-neon-purple/20 to-neon-pink/20 rounded-2xl blur-sm animate-gradient-shift bg-[length:200%_200%]"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                Edit User
              </h3>
              <form onSubmit={handleUpdateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                    <input
                      type="text"
                      value={editingUser.username}
                      disabled
                      className="w-full bg-dark-700/50 border border-slate-600/30 rounded-xl px-4 py-3 text-slate-400"
                      placeholder="Username cannot be changed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full bg-dark-700/80 border border-neon-blue/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-neon-blue focus:shadow-neon-blue/50 transition-all duration-300"
                      placeholder="Enter email..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <input
                      type="password"
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      className="w-full bg-dark-700/80 border border-neon-blue/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-neon-blue focus:shadow-neon-blue/50 transition-all duration-300"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full bg-dark-700/80 border border-neon-blue/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue focus:shadow-neon-blue/50 transition-all duration-300"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-purple hover:to-neon-pink disabled:from-dark-600 disabled:to-dark-500 text-dark-900 disabled:text-slate-400 font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-neon-blue hover:shadow-neon-purple"
                  >
                    {isLoading ? 'Updating...' : 'Update User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditDialog(false);
                      setEditingUser(null);
                      setLocalError('');
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

export default UsersManager;
