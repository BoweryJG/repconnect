import React from 'react';
import { create } from 'zustand';
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material';

// Types
interface Toast {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// Zustand store for toast state management
const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

// Slide transition component
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts, removeToast } = useToastStore();

  return (
    <>
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration || 5000}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionComponent={SlideTransition}
          style={{ bottom: `${index * 70 + 24}px` }} // Stack toasts vertically
        >
          <Alert
            onClose={() => removeToast(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{
              width: '100%',
              boxShadow: 3,
              '& .MuiAlert-icon': {
                fontSize: 26,
              },
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

// Toast hook for components
export const useToast = () => {
  const { addToast } = useToastStore();

  const showSuccess = (message: string, duration?: number) => {
    addToast({ message, severity: 'success', duration });
  };

  const showError = (message: string, duration?: number) => {
    addToast({ message, severity: 'error', duration });
  };

  const showWarning = (message: string, duration?: number) => {
    addToast({ message, severity: 'warning', duration });
  };

  const showInfo = (message: string, duration?: number) => {
    addToast({ message, severity: 'info', duration });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Global toast functions for use outside React components
export const toast = {
  success: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ message, severity: 'success', duration });
  },
  error: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ message, severity: 'error', duration });
  },
  warning: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ message, severity: 'warning', duration });
  },
  info: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ message, severity: 'info', duration });
  },
};

// Default export for convenience
export default toast;
