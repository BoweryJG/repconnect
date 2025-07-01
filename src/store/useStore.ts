import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

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

interface AppState {
  // Contacts
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'callCount'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  
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
}

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
    
    // Contact actions
    addContact: (contact) => set((state) => ({
      contacts: [...state.contacts, {
        ...contact,
        id: crypto.randomUUID(),
        callCount: 0
      }]
    })),
    
    updateContact: (id, updates) => set((state) => ({
      contacts: state.contacts.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    })),
    
    deleteContact: (id) => set((state) => ({
      contacts: state.contacts.filter(c => c.id !== id),
      calls: state.calls.filter(call => call.contactId !== id)
    })),
    
    // Call actions
    addCall: (call) => {
      const id = crypto.randomUUID();
      set((state) => ({
        calls: [...state.calls, { ...call, id }],
        contacts: state.contacts.map(c => 
          c.id === call.contactId 
            ? { ...c, callCount: c.callCount + 1, lastCall: call.timestamp }
            : c
        )
      }));
    },
    
    setActiveCall: (call) => set({ activeCall: call }),
    
    updateCall: (id, updates) => set((state) => ({
      calls: state.calls.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    })),
    
    // UI actions
    setCallInProgress: (inProgress) => set({ isCallInProgress: inProgress }),
    setSelectedContact: (id) => set({ selectedContactId: id }),
    
    // Performance actions
    setPerformanceMode: (mode) => set({ performanceMode: mode }),
    
    // AI actions
    toggleAI: () => set((state) => ({ aiEnabled: !state.aiEnabled })),
    toggleTranscription: () => set((state) => ({ 
      transcriptionEnabled: !state.transcriptionEnabled 
    })),
  }))
);