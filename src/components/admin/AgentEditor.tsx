import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import agentBackendAPI from '../../services/agentBackendAPI';
import { Save, X, Loader2, AlertCircle, ArrowLeft, Plus } from 'lucide-react';

interface AgentFormData {
  name: string;
  role: string;
  tagline: string;
  avatar: string;
  accentColor: string;
  gradient: string;
  shadowColor: string;
  voiceId: string;
  category: string;
  active: boolean;
  personality: {
    tone: string;
    traits: string[];
    approach: string;
    specialties: string[];
    communication_style: string;
  };
  capabilities: {
    handleObjections: boolean;
    provideDetailedInfo: boolean;
    emotionalIntelligence: boolean;
    appointmentScheduling: boolean;
    followUpManagement: boolean;
  };
  voice_config: {
    voice_id: string;
    settings: {
      stability: number;
      similarityBoost: number;
      style: number;
      useSpeakerBoost: boolean;
    };
  };
}

const AgentEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdminAuth();

  const isEditMode = !!id;

  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    role: '',
    tagline: '',
    avatar: '🤖',
    accentColor: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    voiceId: '',
    category: 'general',
    active: true,
    personality: {
      tone: 'professional',
      traits: [],
      approach: 'consultative',
      specialties: [],
      communication_style: 'clear and concise',
    },
    capabilities: {
      handleObjections: true,
      provideDetailedInfo: true,
      emotionalIntelligence: true,
      appointmentScheduling: false,
      followUpManagement: false,
    },
    voice_config: {
      voice_id: '',
      settings: {
        stability: 0.7,
        similarityBoost: 0.8,
        style: 0.5,
        useSpeakerBoost: true,
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [newTrait, setNewTrait] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  // Load agent data if editing
  useEffect(() => {
    const loadAgent = async (agentId: string) => {
      setIsLoading(true);
      setError('');

      try {
        const agent = await agentBackendAPI.getAgent(agentId);
        if (agent) {
          setFormData({
            ...agent,
            voice_config: agent.voice_config || formData.voice_config,
            capabilities: agent.capabilities || formData.capabilities,
          });
        } else {
          setError('Agent not found');
        }
      } catch (err) {
        setError('Failed to load agent data');
        console.error('Error loading agent:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditMode && id) {
      loadAgent(id);
    }
  }, [isEditMode, id, formData.voice_config, formData.capabilities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const url = isEditMode
        ? `${agentBackendAPI.baseURL}/api/agents/${id}`
        : `${agentBackendAPI.baseURL}/api/agents`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: await agentBackendAPI.getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save agent');
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save agent');
    } finally {
      setIsSaving(false);
    }
  };

  const addTrait = () => {
    if (newTrait.trim()) {
      setFormData({
        ...formData,
        personality: {
          ...formData.personality,
          traits: [...formData.personality.traits, newTrait.trim()],
        },
      });
      setNewTrait('');
    }
  };

  const removeTrait = (index: number) => {
    setFormData({
      ...formData,
      personality: {
        ...formData.personality,
        traits: formData.personality.traits.filter((_, i) => i !== index),
      },
    });
  };

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setFormData({
        ...formData,
        personality: {
          ...formData.personality,
          specialties: [...formData.personality.specialties, newSpecialty.trim()],
        },
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    setFormData({
      ...formData,
      personality: {
        ...formData.personality,
        specialties: formData.personality.specialties.filter((_, i) => i !== index),
      },
    });
  };

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">
                {isEditMode ? 'Edit Agent' : 'Create New Agent'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-900/20 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Agent Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="A brief description of the agent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Avatar Emoji</label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="general">General</option>
                  <option value="sales">Sales</option>
                  <option value="coaching">Coaching</option>
                  <option value="dental">Dental</option>
                  <option value="aesthetic">Aesthetic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="h-10 w-20"
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-300">Active</span>
                </label>
              </div>
            </div>
          </section>

          {/* Personality */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Personality</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Communication Tone
                </label>
                <input
                  type="text"
                  value={formData.personality.tone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personality: { ...formData.personality, tone: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Traits</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTrait}
                      onChange={(e) => setNewTrait(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrait())}
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Add a trait"
                    />
                    <button
                      type="button"
                      onClick={addTrait}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition duration-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.personality.traits.map((trait, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700 rounded-full text-sm"
                      >
                        {trait}
                        <button
                          type="button"
                          onClick={() => removeTrait(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Specialties</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Add a specialty"
                    />
                    <button
                      type="button"
                      onClick={addSpecialty}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition duration-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.personality.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700 rounded-full text-sm"
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => removeSpecialty(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Voice Configuration */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Voice Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID</label>
                <input
                  type="text"
                  value={formData.voice_config.voice_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      voice_config: { ...formData.voice_config, voice_id: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="ElevenLabs Voice ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stability ({formData.voice_config.settings.stability})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.voice_config.settings.stability}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      voice_config: {
                        ...formData.voice_config,
                        settings: {
                          ...formData.voice_config.settings,
                          stability: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Similarity Boost ({formData.voice_config.settings.similarityBoost})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.voice_config.settings.similarityBoost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      voice_config: {
                        ...formData.voice_config,
                        settings: {
                          ...formData.voice_config.settings,
                          similarityBoost: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Style ({formData.voice_config.settings.style})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.voice_config.settings.style}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      voice_config: {
                        ...formData.voice_config,
                        settings: {
                          ...formData.voice_config.settings,
                          style: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </section>

          {/* Capabilities */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Capabilities</h2>
            <div className="space-y-3">
              {Object.entries(formData.capabilities).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capabilities: {
                          ...formData.capabilities,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditMode ? 'Update Agent' : 'Create Agent'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AgentEditor;
