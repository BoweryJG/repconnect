import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { render, mockSession, mockUser } from '../test-utils/testUtils';
import { authService } from '../services/authService';
import { api } from '../api';
import { harveyService } from '../services/harveyService';
import { generateMockContact, generateMockRep } from '../test-utils/mockData';

// Mock services
jest.mock('../services/authService');
jest.mock('../api');
jest.mock('../services/harveyService');

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (authService.getSession as jest.Mock).mockResolvedValue(null);
    (authService.onAuthStateChange as jest.Mock).mockReturnValue({
      unsubscribe: jest.fn(),
    });
  });

  describe('Application Routing', () => {
    it('should render login page when not authenticated', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
      });
    });

    it('should redirect to dashboard when authenticated', async () => {
      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);
      (api.contacts.getAll as jest.Mock).mockResolvedValue([]);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
    });

    it('should navigate between main sections', async () => {
      const user = userEvent.setup();
      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);
      (api.contacts.getAll as jest.Mock).mockResolvedValue([generateMockContact()]);
      (harveyService.getMetrics as jest.Mock).mockResolvedValue({
        reputationPoints: 1000,
        harveyStatus: 'rookie',
      });

      render(<App />);

      // Navigate to contacts
      const contactsLink = await screen.findByRole('link', { name: /contacts/i });
      await user.click(contactsLink);

      await waitFor(() => {
        expect(screen.getByText(/Contact Management/i)).toBeInTheDocument();
      });

      // Navigate to Harvey Syndicate
      const harveyLink = screen.getByRole('link', { name: /harvey/i });
      await user.click(harveyLink);

      await waitFor(() => {
        expect(screen.getByText(/Harvey Syndicate/i)).toBeInTheDocument();
      });

      // Navigate to War Room
      const warRoomLink = screen.getByRole('link', { name: /war room/i });
      await user.click(warRoomLink);

      await waitFor(() => {
        expect(screen.getByText(/Harvey War Room/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should complete login flow', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Mock successful login
      (authService.signIn as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);

      // Fill login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
    });

    it('should handle logout', async () => {
      const user = userEvent.setup();
      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);
      (authService.signOut as jest.Mock).mockResolvedValue(undefined);

      render(<App />);

      const userMenu = await screen.findByRole('button', { name: /user menu/i });
      await user.click(userMenu);

      const logoutButton = screen.getByRole('menuitem', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(authService.signOut).toHaveBeenCalled();
      });
    });

    it('should handle session expiry', async () => {
      jest.useFakeTimers();

      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);

      render(<App />);

      // Simulate session expiry
      act(() => {
        jest.advanceTimersByTime(30 * 60 * 1000); // 30 minutes
      });

      await waitFor(() => {
        expect(screen.getByText(/Session Expired/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Contact Management Integration', () => {
    beforeEach(() => {
      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it('should perform full contact CRUD operations', async () => {
      const user = userEvent.setup();
      const mockContacts = [generateMockContact({ name: 'Existing Contact' })];

      (api.contacts.getAll as jest.Mock).mockResolvedValue(mockContacts);
      (api.contacts.create as jest.Mock).mockResolvedValue(
        generateMockContact({ name: 'New Contact' })
      );

      render(<App />);

      // Navigate to contacts
      const contactsLink = await screen.findByRole('link', { name: /contacts/i });
      await user.click(contactsLink);

      // Verify existing contact is displayed
      expect(await screen.findByText('Existing Contact')).toBeInTheDocument();

      // Add new contact
      const addButton = screen.getByRole('button', { name: /add contact/i });
      await user.click(addButton);

      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'New Contact');
      await user.type(screen.getByLabelText(/email/i), 'new@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(api.contacts.create).toHaveBeenCalledWith({
          name: 'New Contact',
          email: 'new@example.com',
          phone: '+1234567890',
        });
      });
    });

    it('should initiate call from contact', async () => {
      const user = userEvent.setup();
      const mockContact = generateMockContact({
        name: 'John Doe',
        phone: '+1234567890',
      });

      (api.contacts.getAll as jest.Mock).mockResolvedValue([mockContact]);
      (api.calls.initiate as jest.Mock).mockResolvedValue({
        callId: 'call-123',
        status: 'connecting',
      });

      render(<App />);

      // Navigate to contacts
      const contactsLink = await screen.findByRole('link', { name: /contacts/i });
      await user.click(contactsLink);

      // Find contact and click call button
      const contactCard = await screen.findByText('John Doe');
      const callButton = within(contactCard.closest('[data-testid="contact-card"]')!).getByRole(
        'button',
        { name: /call/i }
      );

      await user.click(callButton);

      await waitFor(() => {
        expect(api.calls.initiate).toHaveBeenCalledWith({
          contactId: mockContact.id,
          phoneNumber: '+1234567890',
        });
      });

      // Verify call interface appears
      expect(screen.getByText(/Connecting/i)).toBeInTheDocument();
    });
  });

  describe('Harvey Integration', () => {
    beforeEach(() => {
      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);
      (harveyService.connect as jest.Mock).mockResolvedValue(true);
      (harveyService.getMetrics as jest.Mock).mockResolvedValue({
        reputationPoints: 1500,
        currentStreak: 5,
        totalCalls: 50,
        closingRate: 0.25,
        harveyStatus: 'closer',
        dailyVerdict: null,
        activeTrials: [],
      });
    });

    it('should display Harvey metrics on dashboard', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('1500 RP')).toBeInTheDocument();
        expect(screen.getByText('closer')).toBeInTheDocument();
        expect(screen.getByText('5 day streak')).toBeInTheDocument();
      });
    });

    it('should start Harvey coaching session', async () => {
      const user = userEvent.setup();
      const mockContact = generateMockContact();

      (api.contacts.getAll as jest.Mock).mockResolvedValue([mockContact]);
      (harveyService.startCoachingSession as jest.Mock).mockResolvedValue({
        sessionId: 'session-123',
        status: 'active',
      });

      render(<App />);

      // Navigate to contacts
      const contactsLink = await screen.findByRole('link', { name: /contacts/i });
      await user.click(contactsLink);

      // Start Harvey session
      const harveyButton = await screen.findByRole('button', {
        name: /start harvey session/i,
      });
      await user.click(harveyButton);

      await waitFor(() => {
        expect(harveyService.startCoachingSession).toHaveBeenCalled();
        expect(screen.getByText(/Harvey Coaching Active/i)).toBeInTheDocument();
      });
    });

    it('should navigate to War Room and display reps', async () => {
      const user = userEvent.setup();
      const mockReps = [
        generateMockRep({ name: 'Rep 1', id: 'rep-1' }),
        generateMockRep({ name: 'Rep 2', id: 'rep-2' }),
      ];

      (harveyService.getWarRoomData as jest.Mock).mockResolvedValue({
        representatives: mockReps,
        activeBattles: [],
      });

      render(<App />);

      // Navigate to War Room
      const warRoomLink = await screen.findByRole('link', { name: /war room/i });
      await user.click(warRoomLink);

      await waitFor(() => {
        expect(screen.getByText('Rep 1')).toBeInTheDocument();
        expect(screen.getByText('Rep 2')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Error Handling', () => {
    beforeEach(() => {
      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it('should show loading states appropriately', async () => {
      // Make API calls slow
      (api.contacts.getAll as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
      );

      render(<App />);

      // Navigate to contacts
      const contactsLink = await screen.findByRole('link', { name: /contacts/i });
      await userEvent.click(contactsLink);

      // Should show loading skeleton
      expect(screen.getByTestId('contact-list-skeleton')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('contact-list-skeleton')).not.toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (api.contacts.getAll as jest.Mock).mockRejectedValue(new Error('Failed to fetch contacts'));

      render(<App />);

      // Navigate to contacts
      const contactsLink = await screen.findByRole('link', { name: /contacts/i });
      await userEvent.click(contactsLink);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load contacts/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should handle network offline state', async () => {
      // Simulate offline
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      window.dispatchEvent(new Event('offline'));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/You are offline/i)).toBeInTheDocument();
      });

      // Simulate back online
      Object.defineProperty(window.navigator, 'onLine', {
        value: true,
      });

      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(screen.queryByText(/You are offline/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Theme and Accessibility', () => {
    beforeEach(() => {
      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it('should toggle between light and dark themes', async () => {
      const user = userEvent.setup();

      render(<App />);

      const themeToggle = await screen.findByRole('button', {
        name: /toggle theme/i,
      });

      // Check initial theme
      expect(document.body).toHaveClass('light-theme');

      await user.click(themeToggle);

      expect(document.body).toHaveClass('dark-theme');
    });

    it('should maintain focus management during navigation', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Tab through navigation
      await user.tab();
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('link', { name: /contacts/i })).toHaveFocus();

      // Navigate and check focus moves to main content
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(document.activeElement?.tagName).toBe('MAIN');
      });
    });

    it('should announce route changes to screen readers', async () => {
      const user = userEvent.setup();

      render(<App />);

      const liveRegion = screen.getByRole('status', { name: /route announcer/i });

      // Navigate to contacts
      const contactsLink = await screen.findByRole('link', { name: /contacts/i });
      await user.click(contactsLink);

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/Navigated to Contacts/i);
      });
    });
  });

  describe('Data Synchronization', () => {
    beforeEach(() => {
      (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (authService.getSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it('should sync data across different views', async () => {
      const user = userEvent.setup();
      const mockContact = generateMockContact({ name: 'John Doe' });

      (api.contacts.getAll as jest.Mock).mockResolvedValue([mockContact]);
      (api.contacts.update as jest.Mock).mockResolvedValue({
        ...mockContact,
        name: 'John Updated',
      });

      render(<App />);

      // Navigate to contacts
      const contactsLink = await screen.findByRole('link', { name: /contacts/i });
      await user.click(contactsLink);

      // Edit contact
      const editButton = await screen.findByRole('button', { name: /edit/i });
      await user.click(editButton);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'John Updated');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Navigate to dashboard
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      await user.click(dashboardLink);

      // Navigate back to contacts
      await user.click(contactsLink);

      // Verify updated name is shown
      await waitFor(() => {
        expect(screen.getByText('John Updated')).toBeInTheDocument();
      });
    });

    it('should handle real-time updates via WebSocket', async () => {
      let socketCallback: any;
      (harveyService.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'metricsUpdate') {
          socketCallback = callback;
        }
      });

      render(<App />);

      // Initial metrics
      await waitFor(() => {
        expect(screen.getByText('1500 RP')).toBeInTheDocument();
      });

      // Simulate WebSocket update
      act(() => {
        socketCallback?.({
          reputationPoints: 1600,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('1600 RP')).toBeInTheDocument();
      });
    });
  });
});
