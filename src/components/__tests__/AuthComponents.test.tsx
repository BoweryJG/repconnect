import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../Login';
import { SignUp } from '../SignUp';
import { ProtectedRoute } from '../ProtectedRoute';
import { authService } from '../../services/authService';
import { render, mockUser, mockSession } from '../../test-utils/testUtils';
import { useNavigate } from 'react-router-dom';

// Mock services
jest.mock('../../services/authService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
}));

describe('Login Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('should render login form', () => {
    render(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    (authService.signIn as jest.Mock).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error on failed login', async () => {
    const user = userEvent.setup();
    (authService.signIn as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('should require password', async () => {
    const user = userEvent.setup();

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    (authService.signIn as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('should handle OAuth login', async () => {
    (authService.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
      url: 'https://oauth.provider.com/auth',
    });

    render(<Login />);

    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(authService.signInWithOAuth).toHaveBeenCalledWith('google');
  });

  it('should navigate to forgot password', async () => {
    render(<Login />);

    await userEvent.click(screen.getByText(/forgot password/i));

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });
});

describe('SignUp Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('should render signup form', () => {
    render(<SignUp />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should handle successful signup', async () => {
    const user = userEvent.setup();
    (authService.signUp as jest.Mock).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
    });

    render(<SignUp />);

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(authService.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('should validate password strength', async () => {
    const user = userEvent.setup();

    render(<SignUp />);

    await user.type(screen.getByLabelText(/^password$/i), 'weak');

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate password match', async () => {
    const user = userEvent.setup();

    render(<SignUp />);

    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should handle signup errors', async () => {
    const user = userEvent.setup();
    (authService.signUp as jest.Mock).mockRejectedValueOnce(new Error('Email already exists'));

    render(<SignUp />);

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });

  it('should accept terms and conditions', async () => {
    const user = userEvent.setup();

    render(<SignUp />);

    const termsCheckbox = screen.getByRole('checkbox', {
      name: /i agree to the terms/i,
    });

    expect(termsCheckbox).not.toBeChecked();

    await user.click(termsCheckbox);

    expect(termsCheckbox).toBeChecked();
  });

  it('should require terms acceptance', async () => {
    const user = userEvent.setup();

    render(<SignUp />);

    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    // Don't check terms
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/You must accept the terms/i)).toBeInTheDocument();
    });
  });
});

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when authenticated', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValueOnce(true);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should redirect to login when not authenticated', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValueOnce(false);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Navigate to /login')).toBeInTheDocument();
    });
  });

  it('should show loading state while checking auth', () => {
    (authService.isAuthenticated as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 1000))
    );

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle auth check errors', async () => {
    (authService.isAuthenticated as jest.Mock).mockRejectedValueOnce(
      new Error('Auth check failed')
    );

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Navigate to /login')).toBeInTheDocument();
    });
  });

  it('should pass through route params', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValueOnce(true);

    const TestComponent = ({ id }: { id: string }) => <div>Item {id}</div>;

    render(
      <ProtectedRoute>
        <TestComponent id="123" />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Item 123')).toBeInTheDocument();
    });
  });
});

describe('Password Reset Flow', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('should send password reset email', async () => {
    const user = userEvent.setup();
    (authService.resetPassword as jest.Mock).mockResolvedValueOnce(true);

    render(<ForgotPassword />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset email/i }));

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText(/Check your email/i)).toBeInTheDocument();
    });
  });

  it('should handle password update', async () => {
    const user = userEvent.setup();
    (authService.updatePassword as jest.Mock).mockResolvedValueOnce(true);

    render(<ResetPassword token="reset-token-123" />);

    await user.type(screen.getByLabelText(/new password/i), 'NewPassword123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPassword123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(authService.updatePassword).toHaveBeenCalledWith('NewPassword123!');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});

describe('Session Management', () => {
  it('should show session timeout warning', async () => {
    jest.useFakeTimers();

    render(<SessionManager />);

    // Simulate session warning after 25 minutes
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText(/Your session will expire in 5 minutes/i)).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should extend session when requested', async () => {
    jest.useFakeTimers();
    (authService.refreshSession as jest.Mock).mockResolvedValueOnce(mockSession);

    render(<SessionManager />);

    // Trigger warning
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });

    const extendButton = await screen.findByRole('button', { name: /extend session/i });
    await userEvent.click(extendButton);

    expect(authService.refreshSession).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
