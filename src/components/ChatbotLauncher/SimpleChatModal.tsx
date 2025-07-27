import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Box,
  Typography,
  Avatar,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import agentChatAPI from '../../services/agentChatAPI';
import './SimpleChatModal.css';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
  agentAvatar?: string;
  agentRole?: string;
  agentId?: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function ChatModal({
  isOpen,
  onClose,
  agentName = 'AI Assistant',
  agentAvatar = '🤖',
  agentRole = 'Your Personal AI Concierge',
  agentId = 'harvey-ai',
}: ChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session when modal opens
  useEffect(() => {
    if (isOpen && agentId) {
      const newSessionId = `${agentId}-${Date.now()}`;
      setSessionId(newSessionId);

      // Send welcome message
      setMessages([
        {
          id: 'welcome',
          content: `Hello! I'm ${agentName}. ${agentRole}. How can I help you today?`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, agentId, agentName, agentRole]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !sessionId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await (agentChatAPI as any).sendMessage({
        message: inputValue,
        agentId: agentId!,
        userId: user?.id || 'guest-' + Date.now(),
        sessionId: sessionId,
      });

      if (response.message || response.response) {
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          content: response.message || response.response,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessionId, agentId, user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth className="simple-chat-modal">
      {/* Header */}
      <div className="chat-modal-header">
        <div className="chat-modal-agent-info">
          <Avatar className="chat-modal-avatar">{agentAvatar}</Avatar>
          <div>
            <Typography variant="h6" className="chat-modal-agent-name">
              {agentName}
            </Typography>
            <Typography variant="caption" className="chat-modal-agent-role">
              {agentRole}
            </Typography>
          </div>
        </div>
        <IconButton onClick={onClose} className="chat-modal-close-button">
          <X size={24} />
        </IconButton>
      </div>

      {/* Messages */}
      <DialogContent className="chat-modal-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.isUser ? 'user' : 'agent'}`}>
            <div className="chat-message-bubble">
              <Typography variant="body1" className="chat-message-text">
                {message.content}
              </Typography>
              <Typography variant="caption" className="chat-message-time">
                {formatTime(message.timestamp)}
              </Typography>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message agent">
            <div className="chat-message-bubble">
              <div className="chat-loading">
                <CircularProgress size={16} />
                <Typography variant="body2">Thinking...</Typography>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </DialogContent>

      {/* Input */}
      <div className="chat-modal-input">
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  color="primary"
                >
                  {isLoading ? <Loader2 className="spinning" size={20} /> : <Send size={20} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </div>
    </Dialog>
  );
}
