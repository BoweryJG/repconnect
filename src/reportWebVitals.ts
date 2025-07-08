import { ReportHandler } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Enhanced reporting with performance monitoring
export const reportWebVitalsToMonitor = () => {
  reportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
    }
    
    // You can send to analytics here
    // Example: sendToAnalytics(metric);
    
    // Store in performance monitor for adaptive rendering
    if (metric.name === 'FCP' && metric.value > 3000) {
    }
  });
};

export default reportWebVitals;
