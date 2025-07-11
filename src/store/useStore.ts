import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import logger from '../utils/logger';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
  lastCall?: Date;
  callCount: number;
  notes?: string;
  tags?: string[];
  location?: {
    city?: string;
    state?: string;
    coordinates?: [number, number];
  };
  value?: 'high' | 'standard';
  interestScore?: Record<string, number>;
}

interface Call {
  id: string;
  contactId: string;
  phoneNumber: string;
  duration: number;
  timestamp: Date;
  type: 'incoming' | 'outgoing' | 'missed';
  recording?: string;
  transcript?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  summary?: string;
  callSid?: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  voiceSettings?: {
    voice?: string;
    pitch?: number;
    rate?: number;
    volume?: number;
  };
  personality?: string;
  specialties?: string[];
}

interface AppState {
  // Contacts
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'callCount'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  setContacts: (contacts: Contact[]) => void;

  // Calls
  calls: Call[];
  activeCall: Call | null;
  addCall: (call: Omit<Call, 'id'>) => void;
  setActiveCall: (call: Call | null) => void;
  updateCall: (id: string, updates: Partial<Call>) => void;

  // UI State
  isCallInProgress: boolean;
  setCallInProgress: (inProgress: boolean) => void;
  selectedContactId: string | null;
  setSelectedContact: (id: string | null) => void;

  // Performance
  performanceMode: 'ultra' | 'balanced' | 'battery';
  setPerformanceMode: (mode: 'ultra' | 'balanced' | 'battery') => void;

  // AI Features
  aiEnabled: boolean;
  toggleAI: () => void;
  transcriptionEnabled: boolean;
  toggleTranscription: () => void;

  // Auth State
  isAuthenticated: boolean;
  setAuthenticated: (authenticated: boolean) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
  subscriptionTier: string;
  setSubscriptionTier: (tier: string) => void;

  // Agents
  agents: Agent[];
  currentAgentId: string;
  setCurrentAgent: (agentId: string) => void;
  addAgent: (agent: Omit<Agent, 'id'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
}

// Default agents
const defaultAgents: Agent[] = [
  {
    id: 'harvey',
    name: 'Harvey',
    description: 'Professional sales closer with charm and confidence',
    avatar: '🤵',
    voiceSettings: {
      voice: 'en-US-Neural2-D',
      pitch: 0.9,
      rate: 1.0,
      volume: 1.0,
    },
    personality: 'Confident, charming, persuasive',
    specialties: ['Sales', 'Closing deals', 'Relationship building'],
  },
  {
    id: 'sophia',
    name: 'Sophia',
    description: 'Empathetic customer success specialist',
    avatar: '👩‍💼',
    voiceSettings: {
      voice: 'en-US-Neural2-F',
      pitch: 1.1,
      rate: 0.95,
      volume: 0.9,
    },
    personality: 'Warm, understanding, patient',
    specialties: ['Customer support', 'Problem solving', 'Retention'],
  },
  {
    id: 'alex',
    name: 'Alex',
    description: 'Technical expert and product specialist',
    avatar: '👨‍💻',
    voiceSettings: {
      voice: 'en-US-Neural2-A',
      pitch: 1.0,
      rate: 1.1,
      volume: 0.95,
    },
    personality: 'Knowledgeable, analytical, helpful',
    specialties: ['Technical support', 'Product demos', 'Training'],
  },
  {
    id: 'maya',
    name: 'Maya',
    description: 'Creative marketing strategist',
    avatar: '👩‍🎨',
    voiceSettings: {
      voice: 'en-US-Neural2-C',
      pitch: 1.05,
      rate: 1.05,
      volume: 1.0,
    },
    personality: 'Creative, enthusiastic, strategic',
    specialties: ['Marketing', 'Branding', 'Campaign planning'],
  },
];

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    contacts: [],
    calls: [],
    activeCall: null,
    isCallInProgress: false,
    selectedContactId: null,
    performanceMode: 'ultra',
    aiEnabled: true,
    transcriptionEnabled: true,
    isAuthenticated: false,
    showLoginModal: false,
    showSubscriptionModal: false,
    subscriptionTier: 'free',
    agents: defaultAgents,
    currentAgentId: 'harvey',

    // Contact actions
    addContact: (contact) =>
      set((state) => ({
        contacts: [
          ...state.contacts,
          {
            ...contact,
            id: crypto.randomUUID(),
            callCount: 0,
          },
        ],
      })),

    updateContact: (id, updates) =>
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),

    deleteContact: (id) =>
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
        calls: state.calls.filter((call) => call.contactId !== id),
      })),

    setContacts: (contacts) => set({ contacts }),

    // Call actions
    addCall: (call) => {
      const id = crypto.randomUUID();
      set((state) => ({
        calls: [...state.calls, { ...call, id }],
        contacts: state.contacts.map((c) =>
          c.id === call.contactId
            ? { ...c, callCount: c.callCount + 1, lastCall: call.timestamp }
            : c
        ),
      }));
    },

    setActiveCall: (call) => set({ activeCall: call }),

    updateCall: (id, updates) =>
      set((state) => ({
        calls: state.calls.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),

    // UI actions
    setCallInProgress: (inProgress) => set({ isCallInProgress: inProgress }),
    setSelectedContact: (id) => set({ selectedContactId: id }),

    // Performance actions
    setPerformanceMode: (mode) => set({ performanceMode: mode }),

    // AI actions
    toggleAI: () => set((state) => ({ aiEnabled: !state.aiEnabled })),
    toggleTranscription: () =>
      set((state) => ({
        transcriptionEnabled: !state.transcriptionEnabled,
      })),

    // Auth actions
    setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
    setShowLoginModal: (show) => set({ showLoginModal: show }),
    setShowSubscriptionModal: (show) => set({ showSubscriptionModal: show }),
    setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),

    // Agent actions
    setCurrentAgent: (agentId) => set({ currentAgentId: agentId }),

    addAgent: (agent) =>
      set((state) => ({
        agents: [
          ...state.agents,
          {
            ...agent,
            id: crypto.randomUUID(),
          },
        ],
      })),

    updateAgent: (id, updates) =>
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),

    deleteAgent: (id) =>
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
        currentAgentId:
          state.currentAgentId === id ? state.agents[0]?.id || 'harvey' : state.currentAgentId,
      })),
  }))
);
