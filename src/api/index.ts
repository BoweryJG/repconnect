import apiClient from '../config/api';

// Contact API functions
export const contactsApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/contacts', params ? { params } : {});
    return response.data?.data || response.data;
  },

  create: async (contactData: any) => {
    const response = await apiClient.post('/contacts', contactData);
    return response.data?.data || response.data;
  },

  update: async (id: string, contactData: any) => {
    const response = await apiClient.put(`/contacts/${id}`, contactData);
    return response.data?.data || response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/contacts/${id}`);
    return response.data?.data || response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data?.data || response.data;
  },

  enrich: async (id: string) => {
    const response = await apiClient.post(`/contacts/${id}/enrich`);
    return response.data?.data || response.data;
  },

  importCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/contacts/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data || response.data;
  },
};

// Call API functions
export const callsApi = {
  initiate: async (callData: any) => {
    const response = await apiClient.post('/calls/initiate', callData);
    return response.data?.data || response.data;
  },

  end: async (callId: string) => {
    const response = await apiClient.post(`/calls/${callId}/end`);
    return response.data?.data || response.data;
  },

  getHistory: async (params?: any) => {
    const response = await apiClient.get('/calls/history', params ? { params } : {});
    return response.data?.data || response.data;
  },

  getById: async (callId: string) => {
    const response = await apiClient.get(`/calls/${callId}`);
    return response.data?.data || response.data;
  },

  getSummary: async (callId: string) => {
    const response = await apiClient.get(`/calls/${callId}/summary`);
    return response.data?.data || response.data;
  },

  saveTranscript: async (callId: string, transcript: any) => {
    const response = await apiClient.post(`/calls/${callId}/transcript`, transcript);
    return response.data?.data || response.data;
  },
};

// Harvey API functions
export const harveyApi = {
  initialize: async (repId: string, repName: string) => {
    const response = await apiClient.post('/harvey/initialize', { repId, repName });
    return response.data;
  },

  getStatus: async () => {
    const response = await apiClient.get('/harvey/status');
    return response.data?.data || response.data;
  },

  initializeRep: async (repConfig: any) => {
    const response = await apiClient.post('/harvey/initialize', repConfig);
    return response.data?.data || response.data;
  },

  startSession: async (sessionData: any) => {
    const response = await apiClient.post('/harvey/session/start', sessionData);
    return response.data?.data || response.data;
  },

  getAnalytics: async (repId: string, params?: any) => {
    const response = await apiClient.get(`/harvey/analytics/${repId}`, params ? { params } : {});
    return response.data?.data || response.data;
  },

  getPerformance: async (repId: string) => {
    const response = await apiClient.get(`/harvey/performance/${repId}`);
    return response.data;
  },

  triggerIntervention: async (repId: string, trigger: string, context: any) => {
    const response = await apiClient.post('/harvey/intervention', { repId, trigger, context });
    return response.data;
  },

  createChallenge: async (repId: string) => {
    const response = await apiClient.post('/harvey/challenge', { repId });
    return response.data;
  },

  getLeaderboard: async () => {
    const response = await apiClient.get('/harvey/leaderboard');
    return response.data;
  },

  analyzeCall: async (callData: any) => {
    const response = await apiClient.post('/harvey/analyze-call', callData);
    return response.data;
  },

  chat: async (message: string, agentId: string, sessionId?: string, context?: any[]) => {
    const response = await apiClient.post('/harvey/chat', { message, agentId, sessionId, context });
    return response.data;
  },
};

// Auth API functions
export const authApi = {
  signIn: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/signin', { email, password });
    return response.data;
  },

  signUp: async (email: string, password: string, userData: any) => {
    const response = await apiClient.post('/auth/signup', { email, password, ...userData });
    return response.data;
  },

  signOut: async () => {
    const response = await apiClient.post('/auth/signout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

// Pipeline API functions
export const pipelineApi = {
  getStages: async () => {
    const response = await apiClient.get('/pipeline/stages');
    return response.data?.data || response.data;
  },

  moveContact: async (moveData: any) => {
    const response = await apiClient.post('/pipeline/move', moveData);
    return response.data?.data || response.data;
  },

  getMetrics: async () => {
    const response = await apiClient.get('/pipeline/metrics');
    return response.data?.data || response.data;
  },
};

// Combined API export
export const api = {
  contacts: contactsApi,
  calls: callsApi,
  harvey: harveyApi,
  auth: authApi,
  pipeline: pipelineApi,
};

export default api;
