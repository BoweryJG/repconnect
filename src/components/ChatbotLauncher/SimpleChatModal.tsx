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
import { logger } from '../../utils/prodLogger';
import { showError } from '../UserFeedback';
import { withRetry } from '../../utils/apiRetry';
import { RateLimitFeedback } from '../RateLimitFeedback';

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

const ChatModalComponent: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  agentName = 'AI Assistant',
  agentAvatar = '🤖',
  agentRole = 'Your Personal AI Concierge',
  agentId = 'harvey-ai',
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
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
            logger.error('Failed to create conversation', error, 'SimpleChatModal');
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
        // Fallback to REST API with retry
        await withRetry(
          () =>
            (agentChatAPI as any).streamMessage({
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
            }),
          { maxRetries: 2, baseDelay: 1000 }
        );
      }
    } catch (error: any) {
      logger.error('Failed to send message', error, 'SimpleChatModal');

      // Check if it's a rate limit error
      if (error.name === 'RateLimitError') {
        setIsRateLimited(true);
        setMessages((prev) =>
          prev.map((msg) => (msg.id === agentMessageId ? { ...msg, content: error.message } : msg))
        );
      } else {
        showError('Failed to send message. Please try again.');
        // Remove the placeholder message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== agentMessageId));
      }
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

      {/* Rate Limit Feedback */}
      {isRateLimited && <RateLimitFeedback isAI={true} onReset={() => setIsRateLimited(false)} />}

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
};

export const ChatModal = React.memo(ChatModalComponent);
export default ChatModal;
