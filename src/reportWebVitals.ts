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
      console.log(`${metric.name}: ${metric.value.toFixed(2)}ms`);
    }
    
    // You can send to analytics here
    // Example: sendToAnalytics(metric);
    
    // Store in performance monitor for adaptive rendering
    if (metric.name === 'FCP' && metric.value > 3000) {
      console.warn('Slow First Contentful Paint detected');
    }
  });
};

export default reportWebVitals;
