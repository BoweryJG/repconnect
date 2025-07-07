import React from 'react';
import { useToast } from './toast';
import toast from './toast'; // For use outside React components

/**
 * Example: Using toast notifications in a React component
 */
export const ComponentExample = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleError = () => {
    showError('Something went wrong. Please try again.');
  };

  const handleWarning = () => {
    showWarning('Please review your input before proceeding.');
  };

  const handleInfo = () => {
    showInfo('New features are available in settings.');
  };

  const handleCustomDuration = () => {
    // Custom duration in milliseconds (3 seconds)
    showSuccess('This message will disappear in 3 seconds', 3000);
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
      <button onClick={handleCustomDuration}>Show Custom Duration</button>
    </div>
  );
};

/**
 * Example: Using toast notifications outside React components
 * (e.g., in API calls, utilities, etc.)
 */
export const utilityExample = async () => {
  try {
    // Simulate API call
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();
    
    // Show success notification
    toast.success('Data loaded successfully!');
    
    return data;
  } catch (error) {
    // Show error notification
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    toast.error(`Failed to load data: ${errorMessage}`);
    throw error;
  }
};

/**
 * Example: Replacing alert() calls
 */
export const replaceAlertExample = () => {
  // Old way:
  // alert('Welcome to the application!');
  
  // New way:
  toast.info('Welcome to the application!');
  
  // Old way:
  // alert('Error: Invalid phone number');
  
  // New way:
  toast.error('Invalid phone number');
  
  // Old way:
  // if (confirm('Are you sure you want to delete this contact?')) {
  //   deleteContact();
  // }
  
  // New way (for confirmations, you'd still need a modal dialog):
  // For simple notifications:
  toast.warning('Contact deletion requires confirmation');
};

/**
 * Example: Integration with async operations
 */
export const AsyncOperationExample = () => {
  const { showSuccess, showError, showInfo } = useToast();

  const handleAsyncOperation = async () => {
    showInfo('Processing your request...');
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success
      showSuccess('Request processed successfully!');
    } catch (error) {
      showError('Failed to process request');
    }
  };

  return <button onClick={handleAsyncOperation}>Process Request</button>;
};

/**
 * Usage Instructions:
 * 
 * 1. Make sure your app is wrapped with <ToastProvider>:
 *    <ToastProvider>
 *      <App />
 *    </ToastProvider>
 * 
 * 2. In React components, use the useToast hook:
 *    const { showSuccess, showError, showWarning, showInfo } = useToast();
 * 
 * 3. Outside React components, import the default toast object:
 *    import toast from './utils/toast';
 *    toast.success('Message');
 * 
 * 4. All methods accept an optional duration parameter (in milliseconds):
 *    showSuccess('Message', 3000); // Shows for 3 seconds
 * 
 * 5. Messages stack vertically when multiple toasts are shown
 */