import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WebRTCVoiceInterface from '../components/WebRTCVoiceInterface';
import { AgentVoiceHandler } from '../services/agentVoiceHandler';

// Mock services
jest.mock('../services/webRTCVoiceService');
jest.mock('../services/agentVoiceHandler');

describe('Voice Flow Tests', () => {
  let mockWebRTCService;
  let mockVoiceHandler;
  
  beforeEach(() => {
    mockWebRTCService = {
      checkMicrophonePermissions: jest.fn().mockResolvedValue(true),
      startVoiceSession: jest.fn().mockResolvedValue(true),
      stopVoiceSession: jest.fn(),
      getAudioLevel: jest.fn().mockReturnValue(0.5)
    };
    
    mockVoiceHandler = new AgentVoiceHandler();
  });
  
  describe('WebRTC Voice Interface', () => {
    it('should render microphone button', () => {
      render(<WebRTCVoiceInterface agentId="test-agent" />);
      
      const micButton = screen.getByRole('button', { name: /microphone/i });
      expect(micButton).toBeInTheDocument();
    });
    
    it('should request microphone permissions on first click', async () => {
      render(<WebRTCVoiceInterface agentId="test-agent" />);
      
      const micButton = screen.getByRole('button');
      fireEvent.click(micButton);
      
      await waitFor(() => {
        expect(mockWebRTCService.checkMicrophonePermissions).toHaveBeenCalled();
      });
    });
    
    it('should start voice session after permissions granted', async () => {
      render(<WebRTCVoiceInterface agentId="test-agent" />);
      
      const micButton = screen.getByRole('button');
      fireEvent.click(micButton);
      
      await waitFor(() => {
        expect(mockWebRTCService.startVoiceSession).toHaveBeenCalled();
      });
    });
    
    it('should show speaking indicator when agent speaks', async () => {
      const { container } = render(<WebRTCVoiceInterface agentId="test-agent" />);
      
      // Start session
      const micButton = screen.getByRole('button');
      fireEvent.click(micButton);
      
      // Simulate agent speaking
      mockVoiceHandler.emit('agent-speaking', true);
      
      await waitFor(() => {
        const indicator = container.querySelector('.agent-speaking-indicator');
        expect(indicator).toHaveClass('active');
      });
    });
  });
  
  describe('Agent Voice Handler', () => {
    it('should queue audio chunks', async () => {
      const handler = new AgentVoiceHandler();
      const mockAudioData = new ArrayBuffer(1024);
      
      await handler.handleAgentAudio(mockAudioData);
      
      expect(handler.audioQueue.length).toBe(1);
    });
    
    it('should play audio in sequence', async () => {
      const handler = new AgentVoiceHandler();
      const playNextSpy = jest.spyOn(handler, 'playNextInQueue');
      
      // Add multiple audio chunks
      await handler.handleAgentAudio(new ArrayBuffer(1024));
      await handler.handleAgentAudio(new ArrayBuffer(1024));
      
      expect(playNextSpy).toHaveBeenCalled();
    });
    
    it('should pause playback on interruption', () => {
      const handler = new AgentVoiceHandler();
      handler.isPlaying = true;
      
      handler.pausePlayback();
      
      expect(handler.isPlaying).toBe(false);
      expect(handler.audioQueue.length).toBe(0);
    });
  });
  
  describe('Two-Way Conversation Flow', () => {
    it('should handle complete conversation cycle', async () => {
      // This is an integration test for the full flow
      const { container } = render(<WebRTCVoiceInterface agentId="test-agent" />);
      
      // 1. User starts conversation
      const micButton = screen.getByRole('button');
      fireEvent.click(micButton);
      
      await waitFor(() => {
        expect(mockWebRTCService.startVoiceSession).toHaveBeenCalled();
      });
      
      // 2. User speaks (simulate)
      const userAudioLevel = container.querySelector('.user-audio-level');
      expect(userAudioLevel).toBeInTheDocument();
      
      // 3. Agent responds (simulate)
      mockVoiceHandler.emit('agent-speaking', true);
      
      await waitFor(() => {
        const agentIndicator = container.querySelector('.agent-speaking-indicator');
        expect(agentIndicator).toHaveClass('active');
      });
      
      // 4. User interrupts (simulate)
      mockWebRTCService.emit('user-speaking', true);
      
      await waitFor(() => {
        expect(mockVoiceHandler.pausePlayback).toHaveBeenCalled();
      });
      
      // 5. End conversation
      fireEvent.click(micButton);
      
      await waitFor(() => {
        expect(mockWebRTCService.stopVoiceSession).toHaveBeenCalled();
      });
    });
  });
});