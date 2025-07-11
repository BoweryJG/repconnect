import { ReactElement } from 'react';

export interface Agent {
  id: string;
  name: string;
  avatar: string | ReactElement;
  description: string;
  specialty: string;
  color: string;
  available: boolean;
}

export interface ChatbotLauncherProps {
  agents?: Agent[];
  onAgentSelect?: (agent: Agent) => void;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  glowColor?: string;
}

export type LauncherPosition = 'bottom-right' | 'bottom-left';