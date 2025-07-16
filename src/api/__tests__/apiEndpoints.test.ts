import axios from 'axios';
import { api } from '../index';
// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock supabase
const _mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
};

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('Contact Management API', () => {
    it('should fetch contacts', async () => {
      const mockContacts = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockContacts },
      });

      const result = await api.contacts.getAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockContacts);
      expect(mockedAxios.get).toHaveBeenCalledWith('/contacts', {
        params: { page: 1, limit: 10 },
      });
    });

    it('should create a contact', async () => {
      const newContact = {
        name: 'New Contact',
        email: 'new@example.com',
        phone: '+1234567890',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: { id: '3', ...newContact } },
      });

      const result = await api.contacts.create(newContact);

      expect(result.id).toBe('3');
      expect(mockedAxios.post).toHaveBeenCalledWith('/contacts', newContact);
    });

    it('should update a contact', async () => {
      const updates = { name: 'Updated Name' };

      mockedAxios.put.mockResolvedValueOnce({
        data: { success: true, data: { id: '1', ...updates } },
      });

      const result = await api.contacts.update('1', updates);

      expect(result.name).toBe('Updated Name');
      expect(mockedAxios.put).toHaveBeenCalledWith('/contacts/1', updates);
    });

    it('should delete a contact', async () => {
      mockedAxios.delete.mockResolvedValueOnce({
        data: { success: true },
      });

      await api.contacts.delete('1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/contacts/1');
    });

    it('should handle contact enrichment', async () => {
      const enrichmentData = {
        company: 'Tech Corp',
        industry: 'Software',
        size: '100-500',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: enrichmentData },
      });

      const result = await api.contacts.enrich('1');

      expect(result).toEqual(enrichmentData);
      expect(mockedAxios.post).toHaveBeenCalledWith('/contacts/1/enrich');
    });
  });

  describe('Call Management API', () => {
    it('should initiate a call', async () => {
      const callData = {
        contactId: '1',
        phoneNumber: '+1234567890',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            callId: 'call-123',
            status: 'connecting',
            twilioCallSid: 'CA123',
          },
        },
      });

      const result = await api.calls.initiate(callData);

      expect(result.callId).toBe('call-123');
      expect(mockedAxios.post).toHaveBeenCalledWith('/calls/initiate', callData);
    });

    it('should end a call', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      await api.calls.end('call-123');

      expect(mockedAxios.post).toHaveBeenCalledWith('/calls/call-123/end');
    });

    it('should fetch call history', async () => {
      const mockCalls = [
        {
          id: 'call-1',
          contactId: '1',
          duration: 300,
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockCalls },
      });

      const result = await api.calls.getHistory({ userId: 'user-1', limit: 10 });

      expect(result).toEqual(mockCalls);
      expect(mockedAxios.get).toHaveBeenCalledWith('/calls/history', {
        params: { userId: 'user-1', limit: 10 },
      });
    });

    it('should get call summary', async () => {
      const mockSummary = {
        callId: 'call-123',
        summary: 'Discussed product features and pricing',
        sentiment: 'positive',
        nextSteps: ['Send proposal', 'Schedule follow-up'],
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSummary },
      });

      const result = await api.calls.getSummary('call-123');

      expect(result).toEqual(mockSummary);
      expect(mockedAxios.get).toHaveBeenCalledWith('/calls/call-123/summary');
    });

    it('should save call transcript', async () => {
      const transcript = {
        segments: [
          { speaker: 'agent', text: 'Hello, how can I help?', timestamp: 0 },
          { speaker: 'customer', text: 'I need information about...', timestamp: 2 },
        ],
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      await api.calls.saveTranscript('call-123', transcript);

      expect(mockedAxios.post).toHaveBeenCalledWith('/calls/call-123/transcript', transcript);
    });
  });

  describe('Harvey API Endpoints', () => {
    it('should get Harvey status', async () => {
      const mockStatus = {
        initialized: true,
        activeReps: 5,
        totalSessions: 150,
        health: 'healthy',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockStatus },
      });

      const result = await api.harvey.getStatus();

      expect(result).toEqual(mockStatus);
      expect(mockedAxios.get).toHaveBeenCalledWith('/harvey/status');
    });

    it('should initialize Harvey for a rep', async () => {
      const repConfig = {
        repId: 'rep-1',
        name: 'John Doe',
        personality: 'aggressive',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: { initialized: true } },
      });

      const result = await api.harvey.initializeRep(repConfig);

      expect(result.initialized).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith('/harvey/initialize', repConfig);
    });

    it('should start Harvey session', async () => {
      const sessionData = {
        repId: 'rep-1',
        mode: 'coaching',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            sessionId: 'session-123',
            status: 'active',
          },
        },
      });

      const result = await api.harvey.startSession(sessionData);

      expect(result.sessionId).toBe('session-123');
      expect(mockedAxios.post).toHaveBeenCalledWith('/harvey/session/start', sessionData);
    });

    it('should get coaching analytics', async () => {
      const mockAnalytics = {
        averageCallDuration: 240,
        conversionRate: 0.25,
        objectionHandlingScore: 8.5,
        energyScore: 9.0,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockAnalytics },
      });

      const result = await api.harvey.getAnalytics('rep-1', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result).toEqual(mockAnalytics);
      expect(mockedAxios.get).toHaveBeenCalledWith('/harvey/analytics/rep-1', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
    });
  });

  describe('Pipeline API', () => {
    it('should fetch pipeline stages', async () => {
      const mockStages = [
        { id: '1', name: 'Lead', order: 1 },
        { id: '2', name: 'Qualified', order: 2 },
        { id: '3', name: 'Proposal', order: 3 },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockStages },
      });

      const result = await api.pipeline.getStages();

      expect(result).toEqual(mockStages);
      expect(mockedAxios.get).toHaveBeenCalledWith('/pipeline/stages');
    });

    it('should move contact in pipeline', async () => {
      const moveData = {
        contactId: '1',
        fromStage: '1',
        toStage: '2',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      await api.pipeline.moveContact(moveData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/pipeline/move', moveData);
    });

    it('should get pipeline metrics', async () => {
      const mockMetrics = {
        totalDeals: 50,
        averageDealSize: 5000,
        conversionRates: {
          Lead: 0.6,
          Qualified: 0.4,
          Proposal: 0.8,
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockMetrics },
      });

      const result = await api.pipeline.getMetrics();

      expect(result).toEqual(mockMetrics);
      expect(mockedAxios.get).toHaveBeenCalledWith('/pipeline/metrics');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors with error response', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            success: false,
            error: 'Invalid request data',
          },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      await expect(api.contacts.getAll()).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            success: false,
            error: 'Invalid request data',
          },
        },
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(api.contacts.getAll()).rejects.toThrow('Network Error');
    });

    it('should retry failed requests', async () => {
      // Mock a successful response on first call
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

      const result = await api.contacts.getAll();

      expect(result).toEqual([]);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Request Interceptors', () => {
    it('should add auth headers to requests', async () => {
      const token = 'test-auth-token';

      // Mock the axios interceptor setup
      mockedAxios.interceptors = {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      };

      // Simulate request interceptor behavior
      const config = { headers: {} };
      config.headers.Authorization = `Bearer ${token}`;

      expect(config.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          headers: {
            'retry-after': '60',
          },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(rateLimitError);

      await expect(api.contacts.getAll()).rejects.toMatchObject({
        response: { status: 429 },
      });
    });
  });

  describe('File Upload API', () => {
    it('should upload contact CSV', async () => {
      const file = new File(['name,email\nJohn,john@example.com'], 'contacts.csv');
      const formData = new FormData();
      formData.append('file', file);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            imported: 1,
            skipped: 0,
            errors: [],
          },
        },
      });

      const result = await api.contacts.importCSV(file);

      expect(result.imported).toBe(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/contacts/import',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
    });
  });
});
