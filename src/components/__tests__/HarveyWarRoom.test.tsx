import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HarveyWarRoom } from '../HarveyWarRoom';
import { harveyService } from '../../services/harveyService';
import { render, mockSocket, waitForAsync } from '../../test-utils/testUtils';
// Mock Three.js
const mockTHREE = {
  PerspectiveCamera: class PerspectiveCamera {},
  Scene: class Scene {},
};

// Mock Three.js and React Three Fiber
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="three-canvas">{children}</div>,
  useFrame: jest.fn(),
  useThree: () => ({
    camera: new mockTHREE.PerspectiveCamera(),
    scene: new mockTHREE.Scene(),
    gl: { domElement: document.createElement('canvas') },
  }),
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Text: ({ children }: any) => <div data-testid="three-text">{children}</div>,
  Sphere: ({ children }: any) => <div data-testid="three-sphere">{children}</div>,
  Stars: () => <div data-testid="three-stars" />,
}));

// Mock services
jest.mock('../../services/harveyService');

describe('HarveyWarRoom', () => {
  const mockReps = [
    {
      id: 'rep-1',
      name: 'John Doe',
      status: 'active',
      currentCall: {
        contactName: 'ACME Corp',
        duration: 120,
        energy: 8,
      },
      metrics: {
        reputationPoints: 1500,
        harveyStatus: 'closer',
        totalCalls: 50,
        closingRate: 0.25,
      },
    },
    {
      id: 'rep-2',
      name: 'Jane Smith',
      status: 'idle',
      currentCall: null,
      metrics: {
        reputationPoints: 2000,
        harveyStatus: 'partner',
        totalCalls: 75,
        closingRate: 0.35,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (harveyService as any).connect = jest.fn();
    (harveyService as any).getWarRoomData = jest.fn().mockResolvedValue({
      representatives: mockReps,
      activeBattles: [],
    });
    (harveyService as any).on = jest.fn();
    (harveyService as any).off = jest.fn();
  });

  describe('Initialization', () => {
    it('should render war room interface', async () => {
      render(<HarveyWarRoom />);

      await waitFor(() => {
        expect(screen.getByText(/Harvey War Room/i)).toBeInTheDocument();
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });
    });

    it('should connect to Harvey service', async () => {
      render(<HarveyWarRoom />);

      await waitFor(() => {
        expect(harveyService.connect).toHaveBeenCalled();
        expect(harveyService.getWarRoomData).toHaveBeenCalled();
      });
    });

    it('should display loading state', () => {
      (harveyService.getWarRoomData as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<HarveyWarRoom />);

      expect(screen.getByText(/Loading War Room/i)).toBeInTheDocument();
    });

    it('should handle connection errors', async () => {
      (harveyService.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      render(<HarveyWarRoom />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to connect/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Representative Display', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<HarveyWarRoom />);
      });
    });

    it('should display all representatives', async () => {
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should show rep status indicators', async () => {
      await waitFor(() => {
        const johnCard = screen.getByTestId('rep-card-rep-1');
        expect(johnCard).toHaveClass('status-active');

        const janeCard = screen.getByTestId('rep-card-rep-2');
        expect(janeCard).toHaveClass('status-idle');
      });
    });

    it('should display current call information', async () => {
      await waitFor(() => {
        expect(screen.getByText('ACME Corp')).toBeInTheDocument();
        expect(screen.getByText(/2:00/)).toBeInTheDocument(); // Duration
        expect(screen.getByText(/Energy: 8/i)).toBeInTheDocument();
      });
    });

    it('should show rep metrics', async () => {
      await waitFor(() => {
        expect(screen.getByText('1500 RP')).toBeInTheDocument();
        expect(screen.getByText('closer')).toBeInTheDocument();
        expect(screen.getByText('25%')).toBeInTheDocument(); // Closing rate
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update rep status in real-time', async () => {
      let statusUpdateCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'repStatusUpdate') {
          statusUpdateCallback = callback;
        }
      });

      render(<HarveyWarRoom />);

      await waitFor(() => {
        expect(screen.getByTestId('rep-card-rep-2')).toHaveClass('status-idle');
      });

      // Simulate status update
      act(() => {
        statusUpdateCallback?.({
          repId: 'rep-2',
          status: 'active',
          currentCall: {
            contactName: 'New Client',
            duration: 0,
            energy: 7,
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('rep-card-rep-2')).toHaveClass('status-active');
        expect(screen.getByText('New Client')).toBeInTheDocument();
      });
    });

    it('should update metrics in real-time', async () => {
      let metricsUpdateCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'metricsUpdate') {
          metricsUpdateCallback = callback;
        }
      });

      render(<HarveyWarRoom />);

      await waitFor(() => {
        expect(screen.getByText('1500 RP')).toBeInTheDocument();
      });

      // Simulate metrics update
      act(() => {
        metricsUpdateCallback?.({
          repId: 'rep-1',
          metrics: {
            reputationPoints: 1600,
            closingRate: 0.3,
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('1600 RP')).toBeInTheDocument();
        expect(screen.getByText('30%')).toBeInTheDocument();
      });
    });
  });

  describe('Battle Mode', () => {
    it('should initiate battle between reps', async () => {
      (harveyService as any).startBattle = jest.fn().mockResolvedValue({
        battleId: 'battle-123',
        participants: ['rep-1', 'rep-2'],
        status: 'active',
      });

      render(<HarveyWarRoom />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Select first rep
      const johnCard = screen.getByTestId('rep-card-rep-1');
      fireEvent.click(johnCard);

      // Select second rep
      const janeCard = screen.getByTestId('rep-card-rep-2');
      fireEvent.click(janeCard);

      // Start battle
      const battleButton = screen.getByRole('button', { name: /start battle/i });
      expect(battleButton).toBeEnabled();
      fireEvent.click(battleButton);

      await waitFor(() => {
        expect(harveyService.startBattle).toHaveBeenCalledWith('rep-1', 'rep-2');
        expect(screen.getByText(/Battle Started!/i)).toBeInTheDocument();
      });
    });

    it('should display active battles', async () => {
      const mockBattle = {
        id: 'battle-123',
        participants: ['rep-1', 'rep-2'],
        status: 'active',
        scores: {
          'rep-1': 85,
          'rep-2': 78,
        },
        timeRemaining: 180,
      };

      (harveyService.getWarRoomData as jest.Mock).mockResolvedValue({
        representatives: mockReps,
        activeBattles: [mockBattle],
      });

      render(<HarveyWarRoom />);

      await waitFor(() => {
        expect(screen.getByText(/Battle in Progress/i)).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument(); // Rep 1 score
        expect(screen.getByText('78')).toBeInTheDocument(); // Rep 2 score
        expect(screen.getByText(/3:00/)).toBeInTheDocument(); // Time remaining
      });
    });

    it('should update battle scores in real-time', async () => {
      let battleUpdateCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'battleUpdate') {
          battleUpdateCallback = callback;
        }
      });

      render(<HarveyWarRoom />);

      // Simulate battle update
      act(() => {
        battleUpdateCallback?.({
          battleId: 'battle-123',
          scores: {
            'rep-1': 90,
            'rep-2': 88,
          },
          event: 'John Doe closed a deal!',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('90')).toBeInTheDocument();
        expect(screen.getByText('88')).toBeInTheDocument();
        expect(screen.getByText(/John Doe closed a deal!/i)).toBeInTheDocument();
      });
    });

    it('should end battle and show results', async () => {
      let battleEndCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'battleEnd') {
          battleEndCallback = callback;
        }
      });

      render(<HarveyWarRoom />);

      // Simulate battle end
      act(() => {
        battleEndCallback?.({
          battleId: 'battle-123',
          winner: 'rep-1',
          finalScores: {
            'rep-1': 95,
            'rep-2': 88,
          },
          rewards: {
            winner: { points: 500, badge: 'battle-champion' },
            loser: { points: 100 },
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Battle Complete!/i)).toBeInTheDocument();
        expect(screen.getByText(/John Doe Wins!/i)).toBeInTheDocument();
        expect(screen.getByText(/\+500 RP/i)).toBeInTheDocument();
      });
    });
  });

  describe('3D Visualization', () => {
    it('should render 3D spheres for each rep', async () => {
      render(<HarveyWarRoom />);

      await waitFor(() => {
        const spheres = screen.getAllByTestId('three-sphere');
        expect(spheres).toHaveLength(2); // One for each rep
      });
    });

    it('should update sphere properties based on rep status', async () => {
      let statusUpdateCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'repStatusUpdate') {
          statusUpdateCallback = callback;
        }
      });

      render(<HarveyWarRoom />);

      await waitFor(() => {
        const sphere = screen.getAllByTestId('three-sphere')[0];
        expect(sphere).toHaveAttribute('data-energy', '8');
      });

      // Update energy level
      act(() => {
        statusUpdateCallback?.({
          repId: 'rep-1',
          currentCall: {
            energy: 10,
          },
        });
      });

      await waitFor(() => {
        const sphere = screen.getAllByTestId('three-sphere')[0];
        expect(sphere).toHaveAttribute('data-energy', '10');
      });
    });
  });

  describe('Spectator Mode', () => {
    it('should toggle spectator mode', async () => {
      render(<HarveyWarRoom />);

      const spectatorButton = await screen.findByRole('button', {
        name: /spectator mode/i,
      });

      fireEvent.click(spectatorButton);

      await waitFor(() => {
        expect(screen.getByText(/Spectating/i)).toBeInTheDocument();
        expect(screen.getByTestId('spectator-overlay')).toBeInTheDocument();
      });
    });

    it('should focus on selected rep in spectator mode', async () => {
      render(<HarveyWarRoom />);

      // Enter spectator mode
      const spectatorButton = await screen.findByRole('button', {
        name: /spectator mode/i,
      });
      fireEvent.click(spectatorButton);

      // Select a rep to spectate
      const johnCard = screen.getByTestId('rep-card-rep-1');
      fireEvent.click(johnCard);

      await waitFor(() => {
        expect(screen.getByText(/Spectating: John Doe/i)).toBeInTheDocument();
        expect(screen.getByTestId('spectator-stats')).toBeInTheDocument();
      });
    });

    it('should show live transcription in spectator mode', async () => {
      let transcriptionCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'transcription') {
          transcriptionCallback = callback;
        }
      });

      render(<HarveyWarRoom />);

      // Enter spectator mode
      const spectatorButton = await screen.findByRole('button', {
        name: /spectator mode/i,
      });
      fireEvent.click(spectatorButton);

      // Simulate transcription
      act(() => {
        transcriptionCallback?.({
          repId: 'rep-1',
          speaker: 'agent',
          text: 'How can I help you today?',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/How can I help you today?/i)).toBeInTheDocument();
      });
    });
  });

  describe('Leaderboard Integration', () => {
    it('should display leaderboard', async () => {
      const mockLeaderboard = [
        { id: 'rep-2', name: 'Jane Smith', points: 2000, rank: 1 },
        { id: 'rep-1', name: 'John Doe', points: 1500, rank: 2 },
      ];

      (harveyService.getLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboard);

      render(<HarveyWarRoom />);

      const leaderboardButton = await screen.findByRole('button', {
        name: /leaderboard/i,
      });
      fireEvent.click(leaderboardButton);

      await waitFor(() => {
        expect(screen.getByText(/War Room Leaderboard/i)).toBeInTheDocument();
        expect(screen.getByText('#1 Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('#2 John Doe')).toBeInTheDocument();
      });
    });

    it('should update leaderboard in real-time', async () => {
      let leaderboardUpdateCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'leaderboardUpdate') {
          leaderboardUpdateCallback = callback;
        }
      });

      render(<HarveyWarRoom />);

      const leaderboardButton = await screen.findByRole('button', {
        name: /leaderboard/i,
      });
      fireEvent.click(leaderboardButton);

      // Simulate leaderboard update
      act(() => {
        leaderboardUpdateCallback?.([
          { id: 'rep-1', name: 'John Doe', points: 2100, rank: 1 },
          { id: 'rep-2', name: 'Jane Smith', points: 2000, rank: 2 },
        ]);
      });

      await waitFor(() => {
        expect(screen.getByText('#1 John Doe')).toBeInTheDocument();
        expect(screen.getByText('2100 RP')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should display performance warnings', async () => {
      // Mock poor performance
      Object.defineProperty(window, 'performance', {
        writable: true,
        value: {
          memory: {
            usedJSHeapSize: 500 * 1024 * 1024, // 500MB
            jsHeapSizeLimit: 512 * 1024 * 1024, // 512MB
          },
        },
      });

      render(<HarveyWarRoom />);

      await waitFor(() => {
        expect(screen.getByText(/Performance Warning/i)).toBeInTheDocument();
      });
    });

    it('should adjust quality based on FPS', async () => {
      jest.useFakeTimers();

      render(<HarveyWarRoom />);

      // Simulate low FPS by advancing timers slowly
      for (let i = 0; i < 10; i++) {
        act(() => {
          jest.advanceTimersByTime(100); // 10 FPS
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('quality-indicator')).toHaveTextContent('Low');
      });

      jest.useRealTimers();
    });
  });

  describe('Sound Effects', () => {
    it('should toggle sound effects', async () => {
      render(<HarveyWarRoom />);

      const soundButton = await screen.findByRole('button', {
        name: /toggle sound/i,
      });

      fireEvent.click(soundButton);

      expect(screen.getByRole('button', { name: /sound off/i })).toBeInTheDocument();
    });

    it('should play sound on battle events', async () => {
      const playMock = jest.fn();
      window.HTMLMediaElement.prototype.play = playMock;

      let battleEventCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'battleEvent') {
          battleEventCallback = callback;
        }
      });

      render(<HarveyWarRoom />);

      // Ensure sound is on
      const soundButton = await screen.findByRole('button', {
        name: /toggle sound/i,
      });
      if (soundButton.textContent?.includes('off')) {
        fireEvent.click(soundButton);
      }

      // Trigger battle event
      act(() => {
        battleEventCallback?.({
          type: 'deal_closed',
          repId: 'rep-1',
        });
      });

      expect(playMock).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<HarveyWarRoom />);

      await waitFor(() => {
        expect(screen.getByRole('main', { name: /war room/i })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /3d visualization/i })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /representatives/i })).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<HarveyWarRoom />);

      await waitFor(async () => {
        await user.tab();
        expect(screen.getByTestId('rep-card-rep-1')).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(screen.getByTestId('rep-card-rep-1')).toHaveClass('selected');
      });
    });

    it('should announce updates to screen readers', async () => {
      let statusUpdateCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'repStatusUpdate') {
          statusUpdateCallback = callback;
        }
      });

      render(<HarveyWarRoom />);

      const liveRegion = screen.getByRole('status', { name: /updates/i });

      // Trigger status update
      act(() => {
        statusUpdateCallback?.({
          repId: 'rep-1',
          status: 'active',
          currentCall: {
            contactName: 'Big Client',
          },
        });
      });

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/John Doe started call with Big Client/i);
      });
    });
  });
});
