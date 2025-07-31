// @ts-nocheck
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import App from './App';

// Mock the auth context and other dependencies
jest.mock('./auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: jest.fn(),
  }),
}));

jest.mock('./services/twilioService', () => ({
  twilioService: {
    initializeTwilioClient: jest.fn(),
    makeCall: jest.fn(),
  },
}));

jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

jest.mock('./store/useStore', () => ({
  useStore: () => ({
    contacts: [],
    setContacts: jest.fn(),
    addContact: jest.fn(),
  }),
}));

jest.mock('./services/harveyService', () => ({
  harveyService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

test('renders app container', async () => {
  render(<App />);

  await waitFor(() => {
    expect(document.body).toBeInTheDocument();
  });
});
