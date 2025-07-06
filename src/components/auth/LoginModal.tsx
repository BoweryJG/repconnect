import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { supabase } from '../../lib/supabase';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const screwRefs = useRef<HTMLDivElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Simple entrance animation
      const tl = gsap.timeline();
      
      tl.fromTo(modalRef.current, 
        { 
          scale: 0.9, 
          opacity: 0
        },
        { 
          scale: 1, 
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        }
      );

      // Simple screw appearance - no rotation
      screwRefs.current.forEach((screw, index) => {
        if (screw) {
          tl.fromTo(screw,
            { 
              scale: 0, 
              opacity: 0
            },
            { 
              scale: 1, 
              opacity: 1,
              duration: 0.2,
              ease: "power2.out",
              delay: index * 0.05
            },
            "-=0.2"
          );
        }
      });
    }
  }, [isOpen]);

  const handleSignIn = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      setLoadingProvider(provider);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      
      // Success animation
      if (modalRef.current) {
        gsap.to(modalRef.current, {
          scale: 1.05,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            onSuccess?.();
          }
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      // Error shake animation
      if (modalRef.current) {
        gsap.timeline()
          .to(modalRef.current, { x: -10, duration: 0.1 })
          .to(modalRef.current, { x: 10, duration: 0.1 })
          .to(modalRef.current, { x: -10, duration: 0.1 })
          .to(modalRef.current, { x: 10, duration: 0.1 })
          .to(modalRef.current, { x: 0, duration: 0.1 });
      }
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="starfield">
        <div className="stars"></div>
      </div>
      
      <div 
        ref={modalRef}
        className="login-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Removed power rail - keeping design clean */}

        {/* Luxury Screws - 4 corners */}
        <div 
          ref={el => {
            if (el) screwRefs.current[0] = el;
          }} 
          className="screw screw-tl"
        />
        <div 
          ref={el => {
            if (el) screwRefs.current[1] = el;
          }} 
          className="screw screw-tr"
        />
        <div 
          ref={el => {
            if (el) screwRefs.current[2] = el;
          }} 
          className="screw screw-bl"
        />
        <div 
          ref={el => {
            if (el) screwRefs.current[3] = el;
          }} 
          className="screw screw-br"
        />

        {/* Close Button */}
        <button className="close-btn" onClick={onClose} />

        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-icon">
            <svg
              className="logo-jewel"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="jewel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4B96DC" />
                  <stop offset="50%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#4B96DC" />
                </linearGradient>
                <filter id="jewel-glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <polygon
                points="32,4 52,20 60,32 52,44 32,60 12,44 4,32 12,20"
                fill="url(#jewel-gradient)"
                filter="url(#jewel-glow)"
                stroke="#00d4ff"
                strokeWidth="1"
                opacity="0.9"
              />
              <polygon
                points="32,16 44,24 48,32 44,40 32,48 20,40 16,32 20,24"
                fill="#1a1a1a"
                stroke="#4B96DC"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h1 className="logo-title">RepConnect</h1>
          <p className="logo-subtitle">Enterprise Sales Platform</p>
        </div>

        {/* Auth Section */}
        <div className="auth-section">
          <button 
            className="social-btn google"
            onClick={() => handleSignIn('google')}
            disabled={isLoading}
          >
            <div className="social-icon">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            {loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
          </button>

          <button 
            className="social-btn facebook"
            onClick={() => handleSignIn('facebook')}
            disabled={isLoading}
          >
            <div className="social-icon">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="white" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            {loadingProvider === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}
          </button>
        </div>

        {/* Divider */}
        <div className="divider">
          <span className="divider-text">
            <span className="divider-dot"></span>
            SECURE AUTH
            <span className="divider-dot"></span>
          </span>
        </div>

        {/* Email Option */}
        <div className="email-option">
          <a href="#" className="email-link">Sign in with email instead</a>
        </div>

        {/* Terms */}
        <div className="terms">
          By continuing, you agree to RepConnect's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="security-text">
            <span className="led-indicator"></span>
            256-BIT ENCRYPTION
            <span className="led-indicator"></span>
            <span className="led-indicator"></span>
          </div>
        </div>

        {/* Loading Overlay */}
        <div className={`loading-overlay ${isLoading ? 'active' : ''}`}>
          <svg
            className="loading-jewel"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="32,4 52,20 60,32 52,44 32,60 12,44 4,32 12,20"
              fill="url(#jewel-gradient)"
              stroke="#00d4ff"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Success Flare */}
        <div className="success-flare">
          <svg viewBox="0 0 200 200">
            <polygon
              points="100,20 140,60 180,100 140,140 100,180 60,140 20,100 60,60"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="2"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};