import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
  Avatar,
  CircularProgress,
  InputAdornment,
  Chip,
} from '@mui/material';
import { X, Send, Loader2, WifiOff, Wifi } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import websocketChatService from '../../services/websocketChatService';
import agentChatAPI from '../../services/agentChatAPI';
import MessageContent from './MessageContent';
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
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize session and check WebSocket connection when modal opens
  useEffect(() => {
    if (isOpen && agentId) {
      // Check WebSocket connection
      setIsConnected(websocketChatService.isSocketConnected());

      // Try to create conversation via WebSocket if connected
      if (websocketChatService.isSocketConnected()) {
        websocketChatService
          .createConversation(agentId, agentName)
          .then((conversationId) => {
            setSessionId(conversationId);
          })
          .catch((error) => {
            console.error('Failed to create conversation:', error);
            // Fallback to simple session ID
            setSessionId(`${agentId}-${Date.now()}`);
          });
      } else {
        // Fallback to simple session ID
        setSessionId(`${agentId}-${Date.now()}`);
      }

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

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        websocketChatService.cleanupConversation(sessionId);
      }
    };
  }, [isOpen, agentId, agentName, agentRole, sessionId]);

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

    // Add agent message placeholder for streaming
    const agentMessageId = `agent-${Date.now()}`;
    const agentMessage: Message = {
      id: agentMessageId,
      content: '',
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, agentMessage]);
    setStreamingMessageId(agentMessageId);

    try {
      let fullResponse = '';

      // Try WebSocket first if connected
      if (websocketChatService.isSocketConnected()) {
        await websocketChatService.sendMessage(
          sessionId,
          inputValue,
          agentId!,
          // onChunk handler
          (chunk: string) => {
            fullResponse += chunk;
            // Update the agent message with accumulated response
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMessageId ? { ...msg, content: fullResponse } : msg
              )
            );
          },
          // onComplete handler
          (_message) => {
            setIsLoading(false);
            setIsAgentTyping(false);
            setStreamingMessageId(null);
          },
          // onTyping handler
          (isTyping) => {
            setIsAgentTyping(isTyping);
            // Clear any existing timeout
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            // Set timeout to clear typing indicator if no update
            if (isTyping) {
              typingTimeoutRef.current = setTimeout(() => {
                setIsAgentTyping(false);
              }, 5000);
            }
          }
        );
      } else {
        // Fallback to REST API
        await (agentChatAPI as any).streamMessage({
          message: inputValue,
          agentId: agentId!,
          userId: user?.id || 'guest-' + Date.now(),
          sessionId: sessionId,
          onChunk: (chunk: string) => {
            fullResponse += chunk;
            // Update the agent message with accumulated response
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMessageId ? { ...msg, content: fullResponse } : msg
              )
            );
          },
        });
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
      setIsAgentTyping(false);
      setStreamingMessageId(null);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Chip
            size="small"
            icon={isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            label={isConnected ? 'Live' : 'Offline'}
            color={isConnected ? 'success' : 'default'}
            variant="outlined"
          />
          <IconButton onClick={onClose} className="chat-modal-close-button">
            <X size={24} />
          </IconButton>
        </div>
      </div>

      {/* Messages */}
      <DialogContent className="chat-modal-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.isUser ? 'user' : 'agent'}`}>
            <div className="chat-message-bubble">
              <MessageContent
                content={message.content}
                isStreaming={message.id === streamingMessageId}
              />
              <Typography variant="caption" className="chat-message-time">
                {formatTime(message.timestamp)}
              </Typography>
            </div>
          </div>
        ))}
        {(isLoading || isAgentTyping) && (
          <div className="chat-message agent">
            <div className="chat-message-bubble">
              <div className="chat-loading">
                <CircularProgress size={16} />
                <Typography variant="body2">
                  {isAgentTyping ? `${agentName} is typing...` : 'Thinking...'}
                </Typography>
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

export default ChatModal;
