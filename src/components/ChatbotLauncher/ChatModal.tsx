import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Dialog, Box, TextField, IconButton, Typography, Avatar } from '@mui/material';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import agentChatAPI from '../../services/agentChatAPI';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentAvatar: string;
  agentRole: string;
  agentId?: string;
}

// Styled components for custom styling
const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(48px);
    -webkit-backdrop-filter: blur(48px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 500px;
    height: 600px;
    max-height: 90vh;
    margin: 16px;
    overflow: hidden;
  }
`;

const HeaderContainer = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const AgentInfo = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StyledAvatar = styled(Avatar)`
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const MessagesContainer = styled(Box)`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const MessageBubble = styled(Box)<{ isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${(props) =>
    props.isUser
      ? 'linear-gradient(to right, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))'
      : 'rgba(255, 255, 255, 0.1)'};
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  align-self: ${(props) => (props.isUser ? 'flex-end' : 'flex-start')};
`;

const MessageText = styled(Typography)`
  color: white;
  font-size: 14px;
  white-space: pre-wrap;
`;

const MessageTime = styled(Typography)`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  margin-top: 4px;
`;

const InputContainer = styled(Box)`
  padding: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StyledTextField = styled(TextField)`
  flex: 1;

  .MuiInputBase-root {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 4px 16px;
    color: white;

    &:hover {
      border-color: rgba(255, 255, 255, 0.3);
    }

    &.Mui-focused {
      border: 2px solid rgba(168, 85, 247, 0.5);
    }
  }

  .MuiInputBase-input {
    padding: 8px 0;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
      opacity: 1;
    }
  }

  .MuiOutlinedInput-notchedOutline {
    border: none;
  }
`;

const SendButton = styled(IconButton)`
  background: linear-gradient(to right, #a855f7, #ec4899);
  color: white;
  padding: 12px;
  transition: all 0.2s;

  &:hover {
    background: linear-gradient(to right, #9333ea, #db2777);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyStateText = styled(Typography)`
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-top: 32px;
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinningLoader = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const TypingDot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${(props) => props.delay}ms;
`;

const TypingIndicator = styled(Box)`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: fit-content;
`;

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  agentName,
  agentAvatar,
  agentRole,
  agentId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Send message to agent backend
  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsSending(true);
    setIsTyping(true);

    try {
      // Use agentId if provided, otherwise fallback to agentName
      const currentAgentId = agentId || agentName.toLowerCase().replace(/\s+/g, '_');
      console.log('Sending message to agent:', currentAgentId, 'message:', messageText);

      // Send message to agent backend
      const response = await agentChatAPI.sendMessage({
        message: messageText,
        agentId: currentAgentId,
        userId: 'user', // You can use actual user ID if available
        sessionId: sessionId as any,
      });

      console.log('Chat API response:', response);

      if (response.success) {
        // Update session ID if it's the first message
        if (!sessionId && response.sessionId) {
          setSessionId(response.sessionId);
        }

        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.message,
          sender: 'agent',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, agentMessage]);
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I'm having trouble connecting to the RepConnect chat service. Please try again in a moment.",
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <StyledDialog
      open={isOpen}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          backgroundImage: 'none',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Header */}
        <HeaderContainer>
          <AgentInfo>
            <StyledAvatar src={agentAvatar} alt={agentName} />
            <div>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>
                {agentName}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}
              >
                {agentRole}
              </Typography>
            </div>
          </AgentInfo>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              padding: '8px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <X size={20} />
          </IconButton>
        </HeaderContainer>

        {/* Messages Container */}
        <MessagesContainer>
          {messages.length === 0 && (
            <EmptyStateText>Start a conversation with {agentName}</EmptyStateText>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} isUser={message.sender === 'user'}>
              <MessageText>{message.content}</MessageText>
              <MessageTime>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </MessageTime>
            </MessageBubble>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <TypingIndicator>
              <TypingDot delay={0} />
              <TypingDot delay={150} />
              <TypingDot delay={300} />
            </TypingIndicator>
          )}

          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* Input Container */}
        <InputContainer>
          <StyledTextField
            inputRef={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            variant="outlined"
            disabled={isSending}
            fullWidth
          />
          <SendButton onClick={sendMessage} disabled={!inputValue.trim() || isSending}>
            {isSending ? <SpinningLoader size={20} /> : <Send size={20} />}
          </SendButton>
        </InputContainer>
      </div>
    </StyledDialog>
  );
};
