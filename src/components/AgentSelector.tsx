import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Brain, 
  User,
  Check,
  Volume2
} from 'lucide-react';
import { useStore } from '../store/useStore';

export default function AgentSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { agents, currentAgentId, setCurrentAgent } = useStore();
  const currentAgent = agents.find(a => a.id === currentAgentId);

  // Audio announcement system
  const announceAgentSwitch = (agentName: string) => {
    // Create the announcement with a sexy, classy woman's voice
    const utterance = new SpeechSynthesisUtterance(`${agentName} mode activated`);
    
    // Configure the voice for a sexy, classy woman sound
    utterance.voice = speechSynthesis.getVoices().find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Woman') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Victoria') ||
      voice.name.includes('Allison')
    ) || speechSynthesis.getVoices()[0];
    
    // Voice settings for a sultry, intimate tone
    utterance.pitch = 0.8;  // Lower pitch for sultry voice
    utterance.rate = 0.85;   // Slower for intimate feel
    utterance.volume = 0.9;  // Slightly softer
    
    speechSynthesis.speak(utterance);
  };

  const handleAgentSelect = (agentId: string) => {
    if (agentId !== currentAgentId) {
      setCurrentAgent(agentId);
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        announceAgentSwitch(agent.name);
      }
    }
    setIsOpen(false);
  };

  // Load voices when component mounts
  useEffect(() => {
    // Ensure voices are loaded
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        // Voices are now loaded
      });
    }
  }, []);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
        } text-white flex items-center justify-center group`}
        aria-label={isOpen ? 'Close agent selector' : 'Open agent selector'}
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
          <Plus className="w-6 h-6" />
        </div>
        {currentAgent && !isOpen && (
          <div className="absolute -top-1 -right-1 text-2xl">
            {currentAgent.avatar}
          </div>
        )}
      </button>

      {/* Agent Selection Menu */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 w-80 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Agent</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  className={`w-full p-4 rounded-xl transition-all duration-200 ${
                    agent.id === currentAgentId
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">{agent.avatar || '🤖'}</div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{agent.name}</h4>
                        {agent.id === currentAgentId && (
                          <Check className="w-5 h-5" />
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        agent.id === currentAgentId ? 'text-white/90' : 'text-gray-600'
                      }`}>
                        {agent.description}
                      </p>
                      {agent.specialties && agent.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.specialties.slice(0, 2).map((specialty, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded-full ${
                                agent.id === currentAgentId
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Voice Announcements</span>
                <Volume2 className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}