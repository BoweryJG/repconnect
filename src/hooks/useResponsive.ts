import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowDimensions({ width, height });
      
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width < 1024;
      
      // Debug logging for responsive detection
      console.log('🔍 [RESPONSIVE DEBUG] Screen size changed:', {
        width,
        height,
        isMobile: newIsMobile,
        isTablet: newIsTablet,
        isDesktop: !newIsMobile && !newIsTablet,
        threshold: 'Mobile < 768px, Tablet 768-1024px, Desktop > 1024px'
      });
      
      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    windowDimensions,
  };
};