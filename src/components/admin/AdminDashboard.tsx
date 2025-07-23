import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import agentBackendAPI from '../../services/agentBackendAPI';
import api from '../../config/api';
import {
  Users,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  active: boolean;
  category?: string;
  tagline?: string;
  avatar?: string;
  accentColor?: string;
  createdAt?: string;
  updatedAt?: string;
}

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin && !isLoading) {
      navigate('/admin/login');
    }
  }, [isAdmin, isLoading, navigate]);

  // Load agents
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    setError('');

    try {
      const fetchedAgents = await agentBackendAPI.fetchAgents();
      setAgents(fetchedAgents);
    } catch (err: any) {
      setError('Failed to load agents. Please try again.');
      console.error('Error loading agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    agentBackendAPI.clearCache();
    await loadAgents();
    setIsRefreshing(false);
    setSuccessMessage('Agents refreshed successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const toggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/repconnect/agents/${agentId}`, {
        active: !currentStatus,
      });

      // Update local state
      setAgents(
        agents.map((agent) => (agent.id === agentId ? { ...agent, active: !currentStatus } : agent))
      );

      setSuccessMessage('Agent status updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (_err) {
      setError('Failed to update agent status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteAgent = async (agentId: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this agent?')) return;

    try {
      await api.delete(`/api/repconnect/agents/${agentId}`);

      // Update local state
      setAgents(agents.filter((agent) => agent.id !== agentId));

      setSuccessMessage('Agent deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (_err) {
      setError('Failed to delete agent');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filter agents based on search and category
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.tagline?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || agent.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    'all',
    ...new Set(agents.map((agent) => agent.category).filter((cat): cat is string => !!cat)),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Agent Command Center</h1>
              <p className="text-gray-400 text-sm">Welcome, {user?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/admin/agents/new')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition duration-200"
              >
                <Plus className="w-4 h-4" />
                New Agent
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-900/20 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center gap-2 text-green-400 bg-green-900/20 p-4 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category ? category.charAt(0).toUpperCase() + category.slice(1) : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: agent.accentColor || '#8B5CF6' }}
                  >
                    {agent.avatar || agent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-400">{agent.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleAgentStatus(agent.id, agent.active)}
                  className={`p-2 rounded-lg transition duration-200 ${
                    agent.active
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  title={agent.active ? 'Active' : 'Inactive'}
                >
                  {agent.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {agent.tagline && (
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">{agent.tagline}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>{agent.category || 'Uncategorized'}</span>
                <span>ID: {agent.id}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/agents/${agent.id}/edit`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition duration-200"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => deleteAgent(agent.id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No agents found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
