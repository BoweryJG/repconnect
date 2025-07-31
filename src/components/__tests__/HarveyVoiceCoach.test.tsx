// @ts-nocheck
import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HarveyVoiceCoach } from '../HarveyVoiceCoach';
import { harveyService } from '../../services/harveyService';
import { harveyWebRTC } from '../../services/harveyWebRTC';
import { render, mockMediaStream, mockWebRTCPeerConnection } from '../../test-utils/testUtils';

// Mock services
jest.mock('../../services/harveyService');
jest.mock('../../services/harveyWebRTC');
jest.mock('../../services/voiceMetricsService');

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue(mockMediaStream),
} as any;

// Mock RTCPeerConnection
(global as any).RTCPeerConnection = jest.fn(() => mockWebRTCPeerConnection);

describe('HarveyVoiceCoach', () => {
  const mockUserId = 'test-user-id';
  const mockContactId = 'test-contact-id';
  const mockOnEnd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (harveyService as any).connect = jest.fn();
    (harveyService as any).startCoachingSession = jest.fn().mockResolvedValue({
      sessionId: 'session-123',
      status: 'active',
    });
    (harveyWebRTC as any).initialize = jest.fn().mockResolvedValue(true);
    (harveyWebRTC as any).startCall = jest.fn().mockResolvedValue(true);
  });

  describe('Initialization', () => {
    it('should render loading state initially', () => {
      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      expect(screen.getByText(/Initializing Harvey/i)).toBeInTheDocument();
    });

    it('should initialize Harvey connection', async () => {
      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      await waitFor(() => {
        expect(harveyService.connect).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(harveyService.startCoachingSession).toHaveBeenCalledWith(mockUserId, {
          contactId: mockContactId,
        });
      });
    });

    it('should request microphone permissions', async () => {
      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
          audio: true,
          video: false,
        });
      });
    });

    it('should handle permission denial', async () => {
      const permissionError = new Error('Permission denied');
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(permissionError);

      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      await waitFor(() => {
        expect(screen.getByText(/Microphone access denied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Active Call Interface', () => {
    const renderActiveCall = () => {
      return render(
        <HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />
      );
    };

    it('should display call controls', async () => {
      renderActiveCall();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /end call/i })).toBeInTheDocument();
      });
    });

    it('should toggle mute state', async () => {
      renderActiveCall();
      const muteButton = await screen.findByRole('button', { name: /mute/i });

      fireEvent.click(muteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /unmute/i })).toBeInTheDocument();
      });
    });

    it('should display call timer', async () => {
      renderActiveCall();
      await waitFor(() => {
        expect(screen.getByText(/00:00/)).toBeInTheDocument();
      });

      // Fast forward 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByText(/00:05/)).toBeInTheDocument();
      });
    });

    it('should end call when end button clicked', async () => {
      renderActiveCall();
      const endButton = await screen.findByRole('button', { name: /end call/i });

      fireEvent.click(endButton);

      await waitFor(() => {
        expect(harveyWebRTC.endCall).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockOnEnd).toHaveBeenCalled();
      });
    });
  });

  describe('Harvey Coaching Features', () => {
    const renderWithCoaching = () => {
      (harveyService as any).on = jest.fn((event, callback) => {
        if (event === 'coachingAdvice') {
          setTimeout(
            () =>
              callback({
                message: 'Ask about their budget',
                urgency: 'medium',
                category: 'discovery',
              }),
            100
          );
        }
      });

      return render(
        <HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />
      );
    };

    it('should display coaching advice', async () => {
      renderWithCoaching();
      await waitFor(() => {
        expect(screen.getByText(/Ask about their budget/i)).toBeInTheDocument();
      });
    });

    it('should update coaching metrics', async () => {
      renderWithCoaching();
      (harveyService as any).on.mockImplementation((event, callback) => {
        if (event === 'metricsUpdate') {
          callback({
            energyLevel: 8,
            pace: 'good',
            clarity: 9,
            objectionHandling: 7,
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/Energy: 8/i)).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText(/Clarity: 9/i)).toBeInTheDocument();
      });
    });

    it('should show real-time feedback', async () => {
      renderWithCoaching();
      (harveyService as any).on.mockImplementation((event, callback) => {
        if (event === 'feedback') {
          callback({
            type: 'positive',
            message: 'Great job handling that objection!',
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/Great job handling that objection!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Voice Transcription', () => {
    const renderWithTranscription = () => {
      (harveyWebRTC as any).on = jest.fn((event, callback) => {
        if (event === 'transcription') {
          setTimeout(
            () =>
              callback({
                speaker: 'agent',
                text: 'Hello, how can I help you today?',
                timestamp: Date.now(),
              }),
            100
          );
        }
      });

      return render(
        <HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />
      );
    };

    it('should display live transcription', async () => {
      renderWithTranscription();
      await waitFor(() => {
        expect(screen.getByText(/Hello, how can I help you today?/i)).toBeInTheDocument();
      });
    });

    it('should differentiate speakers', async () => {
      renderWithTranscription();
      (harveyWebRTC as any).on.mockImplementation((event, callback) => {
        if (event === 'transcription') {
          callback({
            speaker: 'customer',
            text: 'I need information about your product',
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        const customerText = screen.getByText(/I need information about your product/i);
        expect(customerText).toHaveAttribute('data-speaker', 'customer');
      });
    });
  });

  describe('Performance Visualization', () => {
    it('should show performance graph', async () => {
      render(
        <HarveyVoiceCoach
          userId={mockUserId}
          contactId={mockContactId}
          onEnd={mockOnEnd}
          showPerformanceGraph={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('performance-graph')).toBeInTheDocument();
      });
    });

    it('should update graph with real-time data', async () => {
      let metricsCallback: any;
      (harveyService as any).on.mockImplementation((event, callback) => {
        if (event === 'metricsUpdate') {
          metricsCallback = callback;
        }
      });

      render(
        <HarveyVoiceCoach
          userId={mockUserId}
          contactId={mockContactId}
          onEnd={mockOnEnd}
          showPerformanceGraph={true}
        />
      );

      // Simulate metrics updates
      act(() => {
        metricsCallback?.({
          energyLevel: 5,
          pace: 'slow',
          clarity: 6,
        });
      });

      await waitFor(() => {
        const graph = screen.getByTestId('performance-graph');
        expect(graph).toHaveAttribute('data-energy', '5');
      });
      await waitFor(() => {
        const graph = screen.getByTestId('performance-graph');
        expect(graph).toHaveAttribute('data-clarity', '6');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      (harveyService.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to connect to Harvey/i)).toBeInTheDocument();
      });
    });

    it('should handle WebRTC errors', async () => {
      (harveyWebRTC.initialize as jest.Mock).mockRejectedValueOnce(
        new Error('WebRTC initialization failed')
      );

      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to establish call connection/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (harveyService.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      const retryButton = await screen.findByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      (harveyService.connect as jest.Mock).mockResolvedValueOnce(true);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText(/Failed to connect/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Settings and Configuration', () => {
    it('should open settings modal', async () => {
      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      const settingsButton = await screen.findByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText(/Harvey Settings/i)).toBeInTheDocument();
      });
    });

    it('should save settings changes', async () => {
      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      const settingsButton = await screen.findByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const coachingLevelSlider = await screen.findByLabelText(/Coaching Intensity/i);
      fireEvent.change(coachingLevelSlider, { target: { value: '8' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(harveyService.updateSettings).toHaveBeenCalledWith({
          coachingIntensity: 8,
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /call interface/i })).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByRole('timer', { name: /call duration/i })).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<HarveyVoiceCoach userId={mockUserId} contactId={mockContactId} onEnd={mockOnEnd} />);

      await user.tab();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mute/i })).toHaveFocus();
      });

      await user.tab();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /end call/i })).toHaveFocus();
      });
    });
  });
});
