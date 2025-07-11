import { io } from 'socket.io-client';
import { HarveyService } from '../harveyService';
import { supabase } from '../../lib/supabase';
import { mockSocket, mockSupabaseClient, waitForAsync } from '../../test-utils/testUtils';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockedIo = io as jest.MockedFunction<typeof io>;

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

describe('HarveyService', () => {
  let harveyService: HarveyService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedIo.mockReturnValue(mockSocket as any);
    harveyService = new HarveyService();
  });

  afterEach(() => {
    harveyService.disconnect();
  });

  describe('Connection Management', () => {
    it('should initialize socket connection with correct URL', () => {
      harveyService.connect();
      expect(mockedIo).toHaveBeenCalledWith(
        process.env.REACT_APP_HARVEY_WS_URL || 'http://localhost:3002',
        expect.objectContaining({
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })
      );
    });

    it('should handle connection events', () => {
      const onConnect = jest.fn();
      const onDisconnect = jest.fn();
      const onError = jest.fn();

      harveyService.on('connect', onConnect);
      harveyService.on('disconnect', onDisconnect);
      harveyService.on('error', onError);

      // Simulate connection events
      const connectHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'connect')?.[1];
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      const errorHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'error')?.[1];

      connectHandler?.();
      disconnectHandler?.();
      errorHandler?.(new Error('Test error'));

      expect(onConnect).toHaveBeenCalled();
      expect(onDisconnect).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(new Error('Test error'));
    });

    it('should disconnect properly', () => {
      harveyService.connect();
      harveyService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Metrics Operations', () => {
    it('should fetch user metrics successfully', async () => {
      const mockMetrics = {
        reputationPoints: 1500,
        currentStreak: 5,
        totalCalls: 50,
        closingRate: 0.25,
        harveyStatus: 'closer',
        dailyVerdict: null,
        activeTrials: [],
      };

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMetrics, error: null }),
      });

      const result = await harveyService.getMetrics('test-user-id');
      expect(result).toEqual(mockMetrics);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('harvey_metrics');
    });

    it('should handle metrics fetch error', async () => {
      const mockError = new Error('Failed to fetch metrics');
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      await expect(harveyService.getMetrics('test-user-id')).rejects.toThrow(
        'Failed to fetch metrics'
      );
    });

    it('should update metrics via socket', async () => {
      harveyService.connect();

      const updates = {
        reputationPoints: 100,
        closingRate: 0.05,
      };

      await harveyService.updateMetrics('test-user-id', updates);

      expect(mockSocket.emit).toHaveBeenCalledWith('updateMetrics', {
        userId: 'test-user-id',
        updates,
      });
    });
  });

  describe('Daily Verdict', () => {
    it('should request daily verdict', async () => {
      harveyService.connect();

      const mockVerdict = {
        rating: 8,
        message: 'Solid performance today, kid!',
        timestamp: new Date(),
        tone: 'encouraging',
        advice: 'Keep pushing those numbers up!',
      };

      // Set up the promise before emitting
      const verdictPromise = harveyService.requestDailyVerdict('test-user-id');

      // Get the callback that was registered for 'dailyVerdict'
      const verdictCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'dailyVerdict'
      )?.[1];

      // Simulate server response
      await waitForAsync();
      verdictCallback?.(mockVerdict);

      const result = await verdictPromise;
      expect(result).toEqual(mockVerdict);
      expect(mockSocket.emit).toHaveBeenCalledWith('requestDailyVerdict', {
        userId: 'test-user-id',
      });
    });

    it('should handle verdict request timeout', async () => {
      harveyService.connect();
      jest.useFakeTimers();

      const verdictPromise = harveyService.requestDailyVerdict('test-user-id');

      // Fast-forward past timeout
      jest.advanceTimersByTime(30000);

      await expect(verdictPromise).rejects.toThrow('Daily verdict request timed out');

      jest.useRealTimers();
    });
  });

  describe('Hot Leads Management', () => {
    it('should fetch hot leads', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          company: 'Tech Corp',
          industry: 'Software',
          size: 'Enterprise',
          readyScore: 95,
          multiplier: 3,
          expiresAt: new Date(),
        },
      ];

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockLeads, error: null }),
      });

      const result = await harveyService.getHotLeads();
      expect(result).toEqual(mockLeads);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('hot_leads');
    });

    it('should claim a hot lead', async () => {
      harveyService.connect();

      const claimPromise = harveyService.claimHotLead('lead-1', 'user-1');

      const claimCallback = mockSocket.on.mock.calls.find((call) => call[0] === 'leadClaimed')?.[1];

      await waitForAsync();
      claimCallback?.({ success: true, lead: { id: 'lead-1', claimedBy: 'user-1' } });

      const result = await claimPromise;
      expect(result.success).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('claimLead', {
        leadId: 'lead-1',
        userId: 'user-1',
      });
    });
  });

  describe('Leaderboard', () => {
    it('should fetch leaderboard data', async () => {
      const mockLeaderboard = [
        { id: '1', name: 'Top Rep', points: 5000, status: 'legend', rank: 1 },
        { id: '2', name: 'Good Rep', points: 3000, status: 'partner', rank: 2 },
      ];

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockLeaderboard, error: null }),
      });

      const result = await harveyService.getLeaderboard(10);
      expect(result).toEqual(mockLeaderboard);
    });

    it('should update leaderboard via socket', () => {
      const onLeaderboardUpdate = jest.fn();
      harveyService.on('leaderboardUpdate', onLeaderboardUpdate);

      const updateCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'leaderboardUpdate'
      )?.[1];
      const mockUpdate = [{ id: '1', name: 'Rep', points: 1000, status: 'closer', rank: 1 }];

      updateCallback?.(mockUpdate);

      expect(onLeaderboardUpdate).toHaveBeenCalledWith(mockUpdate);
    });
  });

  describe('Battle System', () => {
    it('should start a battle', async () => {
      harveyService.connect();

      const battlePromise = harveyService.startBattle('user-1', 'user-2');

      const battleCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'battleStarted'
      )?.[1];

      await waitForAsync();
      battleCallback?.({
        battleId: 'battle-1',
        participants: ['user-1', 'user-2'],
        status: 'active',
      });

      const result = await battlePromise;
      expect(result.battleId).toBe('battle-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('startBattle', {
        challenger: 'user-1',
        opponent: 'user-2',
      });
    });

    it('should submit battle performance', async () => {
      harveyService.connect();

      const performance = {
        callDuration: 300,
        objectionHandled: true,
        closingAttempted: true,
        energyLevel: 8,
        harveyRating: 9,
      };

      await harveyService.submitBattlePerformance('battle-1', 'user-1', performance);

      expect(mockSocket.emit).toHaveBeenCalledWith('submitPerformance', {
        battleId: 'battle-1',
        userId: 'user-1',
        performance,
      });
    });
  });

  describe('Trial System', () => {
    it('should fetch active trials', async () => {
      const mockTrials = [
        {
          id: 'trial-1',
          name: 'Cold Call Champion',
          description: 'Make 50 cold calls in one day',
          difficulty: 'HARD',
          requirements: { calls: 50, timeframe: '24h' },
          rewards: { points: 500, badge: 'cold-caller' },
          progress: { current: 25, target: 50 },
        },
      ];

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockTrials, error: null }),
      });

      const result = await harveyService.getActiveTrials('user-1');
      expect(result).toEqual(mockTrials);
    });

    it('should start a trial', async () => {
      harveyService.connect();

      const trialPromise = harveyService.startTrial('user-1', 'trial-1');

      const trialCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'trialStarted'
      )?.[1];

      await waitForAsync();
      trialCallback?.({
        success: true,
        trial: { id: 'trial-1', userId: 'user-1', startedAt: new Date() },
      });

      const result = await trialPromise;
      expect(result.success).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('startTrial', {
        userId: 'user-1',
        trialId: 'trial-1',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle socket errors gracefully', () => {
      const onError = jest.fn();
      harveyService.on('error', onError);

      const errorCallback = mockSocket.on.mock.calls.find((call) => call[0] === 'error')?.[1];
      const testError = new Error('Socket connection failed');

      errorCallback?.(testError);

      expect(onError).toHaveBeenCalledWith(testError);
    });

    it('should retry failed operations', async () => {
      harveyService.connect();

      // First attempt fails
      mockSocket.emit.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      // Second attempt succeeds
      const retryPromise = harveyService.updateMetrics('user-1', { reputationPoints: 100 });

      await waitForAsync();

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
    });
  });
});
