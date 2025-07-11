import React from 'react';
import ChatbotLauncher from './ChatbotLauncher';
import { Typography } from '@mui/material';
import {
  SmartToy,
  Psychology,
  Support,
  AutoAwesome,
  School,
  TrendingUp,
} from '@mui/icons-material';

// Example custom agents
const customAgents = [
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    avatar: <SmartToy />,
    description: 'General purpose AI helper for all your needs',
    specialty: 'General Support',
    color: '#3B82F6',
    available: true,
  },
  {
    id: 'sales-coach',
    name: 'Sales Coach',
    avatar: <Psychology />,
    description: 'Expert guidance for closing deals and sales strategies',
    specialty: 'Sales Training',
    color: '#10B981',
    available: true,
  },
  {
    id: 'tech-support',
    name: 'Tech Support',
    avatar: <Support />,
    description: 'Technical assistance and troubleshooting',
    specialty: 'Technical Help',
    color: '#F59E0B',
    available: true,
  },
  {
    id: 'harvey',
    name: 'Harvey AI',
    avatar: <AutoAwesome />,
    description: 'Premium AI agent with advanced capabilities',
    specialty: 'Premium Support',
    color: '#9333EA',
    available: true,
  },
  {
    id: 'learning-assistant',
    name: 'Learning Assistant',
    avatar: <School />,
    description: 'Personalized learning and training support',
    specialty: 'Education',
    color: '#EC4899',
    available: true,
  },
  {
    id: 'analytics-expert',
    name: 'Analytics Expert',
    avatar: <TrendingUp />,
    description: 'Data analysis and insights generation',
    specialty: 'Analytics',
    color: '#8B5CF6',
    available: false,
  },
];

const ChatbotLauncherExample: React.FC = () => {
  const handleAgentSelect = (agent: any) => {
    // Here you would typically:
    // 1. Open a chat interface with the selected agent
    // 2. Initialize a conversation
    // 3. Track analytics
    alert(`Selected ${agent.name} - ${agent.specialty}`);
  };

  return (
    <div style={{ minHeight: '100vh', padding: 32, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h4" gutterBottom>
        ChatbotLauncher Component Example
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        The chatbot launcher appears in the bottom-right corner. Click the floating orb to see the
        agent carousel.
      </Typography>

      {/* Basic usage with defaults */}
      <ChatbotLauncher onAgentSelect={handleAgentSelect} />

      {/* Advanced usage with custom agents and styling */}
      {/* <ChatbotLauncher 
        agents={customAgents}
        onAgentSelect={handleAgentSelect}
        position="bottom-right"
        primaryColor="#9333EA"
        glowColor="#9333EA"
      /> */}

      {/* Example with bottom-left position */}
      {/* <ChatbotLauncher 
        agents={customAgents.slice(0, 3)}
        onAgentSelect={handleAgentSelect}
        position="bottom-left"
        primaryColor="#10B981"
        glowColor="#10B981"
      /> */}
    </div>
  );
};

export default ChatbotLauncherExample;
