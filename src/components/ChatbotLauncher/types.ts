import { LucideIcon } from 'lucide-react';

export interface AgentPersonality {
  tone: string;
  traits: string[];
  approachStyle: string;
  communicationPreferences: string[];
}

export interface Agent {
  id: string;
  name: string;
  tagline: string;
  avatar:
    | {
        icon: LucideIcon;
        backgroundColor: string;
        iconColor: string;
      }
    | string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
    shadowColor: string;
  };
  personality: AgentPersonality;
  voiceConfig: {
    voiceId: string;
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
  };
  category: 'aesthetic' | 'dental' | 'general' | 'sales';
  knowledgeDomains: string[];
  conversationStarters: string[];
  visualEffects: {
    animation: string;
    glow: boolean;
    pulse: boolean;
    particleEffect: string;
  };
  available?: boolean;
  description?: string;
  specialty?: string;
  color?: string;
}

export interface ChatbotLauncherProps {
  agents?: Agent[];
  onAgentSelect?: (_agent: Agent) => void;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  glowColor?: string;
}

export type LauncherPosition = 'bottom-right' | 'bottom-left';
