import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './LoginModal.css';

const LoginModal = ({
  isOpen,
  onClose,
  onGoogleAuth,
  onFacebookAuth,
  onEmailAuth,
  mode = 'login',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const modalRef = useRef(null);
  const modalOverlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // Set initial transform-style for 3D effects
    gsap.set(modalRef.current, { transformStyle: 'preserve-3d', perspective: 1000 });

    // Modal entrance animation with stagger
    gsap.fromTo(
      modalRef.current,
      {
        scale: 0.8,
        rotationX: 10,
        rotationY: 10,
        opacity: 0,
      },
      {
        duration: 0.8,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        opacity: 1,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.1,
      }
    );

    // Animate screws from the modal container context
    const screws = modalRef.current.querySelectorAll('.screw');
    gsap.fromTo(
      screws,
      {
        scale: 0,
        rotation: -180,
      },
      {
        duration: 0.6,
        scale: 1,
        rotation: 0,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        delay: 0.5,
      }
    );

    // Animate power nodes
    const powerNodes = modalRef.current.querySelectorAll('.power-node');
    gsap.fromTo(
      powerNodes,
      {
        scale: 0,
      },
      {
        duration: 0.4,
        scale: 1,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.7,
      }
    );

    // Hover effects for social buttons
    const socialBtns = modalRef.current.querySelectorAll('.social-btn');
    socialBtns.forEach((btn) => {
      btn.addEventListener('mouseenter', (e) => {
        gsap.to(e.target, {
          duration: 0.3,
          y: -2,
          ease: 'power2.out',
        });
      });

      btn.addEventListener('mouseleave', (e) => {
        gsap.to(e.target, {
          duration: 0.3,
          y: 0,
          ease: 'power2.out',
        });
      });
    });

    // Screw rotation on hover
    const hoverScrews = modalRef.current.querySelectorAll('.screw');
    hoverScrews.forEach((screw) => {
      screw.addEventListener('mouseenter', () => {
        gsap.to(screw, {
          duration: 0.4,
          rotation: '+=360',
          ease: 'power2.inOut',
        });
      });
    });

    // 3D tilt effect on modal
    const modal = modalRef.current;
    let modalRect = modal.getBoundingClientRect();

    const handleMouseMove = (e) => {
      const x = e.clientX - modalRect.left - modalRect.width / 2;
      const y = e.clientY - modalRect.top - modalRect.height / 2;
      const rotateX = (y / modalRect.height) * 5;
      const rotateY = -(x / modalRect.width) * 5;

      gsap.to(modal, {
        duration: 0.3,
        rotationX: rotateX,
        rotationY: rotateY,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(modal, {
        duration: 0.5,
        rotationX: 0,
        rotationY: 0,
        ease: 'power2.out',
      });
    };

    modal.addEventListener('mousemove', handleMouseMove);
    modal.addEventListener('mouseleave', handleMouseLeave);

    // Update modal rect on resize
    const handleResize = () => {
      modalRect = modal.getBoundingClientRect();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      modal.removeEventListener('mousemove', handleMouseMove);
      modal.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (!modalRef.current) return;

    gsap.to(modalRef.current, {
      duration: 0.4,
      scale: 0.8,
      opacity: 0,
      rotationX: -10,
      rotationY: -10,
      ease: 'power2.in',
      onComplete: () => {
        onClose();
      },
    });
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await onGoogleAuth();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 800);
    } catch (error) {
      console.error('Google auth failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setIsLoading(true);
    try {
      await onFacebookAuth();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 800);
    } catch (error) {
      console.error('Facebook auth failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = () => {
    setIsLoading(true);

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      onEmailAuth();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Animated Starfield */}
      <div className="starfield">
        <div className="stars"></div>
      </div>

      {/* Modal Overlay */}
      <div className="modal-overlay" ref={modalOverlayRef}>
        {/* Login Modal */}
        <div className="login-modal" ref={modalRef}>
          {/* Power Rail */}
          <div className="power-rail">
            <div className="power-node"></div>
            <div className="power-node"></div>
            <div className="power-node"></div>
            <div className="power-node"></div>
          </div>

          {/* 4-Point Luxury Screws */}
          <div className="screw screw-tl" style={{ '--screw-index': 0 }}></div>
          <div className="screw screw-tr" style={{ '--screw-index': 1 }}></div>
          <div className="screw screw-bl" style={{ '--screw-index': 2 }}></div>
          <div className="screw screw-br" style={{ '--screw-index': 3 }}></div>

          {/* Close Button */}
          <button className="close-btn" aria-label="Close" onClick={handleClose}></button>

          {/* Logo Section */}
          <div className="logo-section">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                <defs>
                  <linearGradient id="sphereGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#9f58fa', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#4B96DC', stopOpacity: 1 }} />
                  </linearGradient>
                  <radialGradient id="jewelGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                    <stop offset="30%" style={{ stopColor: '#ff00ff', stopOpacity: 1 }} />
                    <stop offset="60%" style={{ stopColor: '#00ffff', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ff00aa', stopOpacity: 0.9 }} />
                  </radialGradient>
                </defs>

                {/* Outer sphere ring */}
                <circle
                  cx="32"
                  cy="32"
                  r="24"
                  fill="none"
                  stroke="url(#sphereGradient)"
                  strokeWidth="3"
                  opacity="0.8"
                />

                {/* Inner sphere ring */}
                <circle
                  cx="32"
                  cy="32"
                  r="16"
                  fill="none"
                  stroke="url(#sphereGradient)"
                  strokeWidth="2"
                  opacity="0.6"
                />

                {/* Animated Jewel Core */}
                <circle cx="32" cy="32" r="6" fill="url(#jewelGradient)" className="logo-jewel">
                  <animate attributeName="r" values="6;8;6" dur="3s" repeatCount="indefinite" />
                  <animate
                    attributeName="opacity"
                    values="0.8;1;0.8"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Orbital dots */}
                <circle cx="32" cy="8" r="3" fill="#9f58fa" opacity="0.8" />
                <circle cx="56" cy="32" r="3" fill="#4B96DC" opacity="0.8" />
                <circle cx="32" cy="56" r="3" fill="#4bd48e" opacity="0.8" />
                <circle cx="8" cy="32" r="3" fill="#00d4ff" opacity="0.8" />
              </svg>
            </div>
            <h1 className="logo-title">
              {mode === 'signup' ? 'Join RepSpheres' : 'Secure Access'}
            </h1>
            <p className="logo-subtitle">
              {mode === 'signup'
                ? 'Create Your RepSpheres Account'
                : 'RepSpheres Authentication Portal'}
            </p>
          </div>

          {/* Social Auth Section */}
          <div className="auth-section">
            {/* Google Sign In */}
            <button className="social-btn google" onClick={handleGoogleAuth}>
              <span className="social-icon">
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
              </span>
              <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
            </button>

            {/* Facebook Sign In */}
            <button className="social-btn facebook" onClick={handleFacebookAuth}>
              <span className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </span>
              <span>{mode === 'signup' ? 'Sign up with Facebook' : 'Continue with Facebook'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="divider">
            <span className="divider-dot"></span>
            <span className="divider-text">OR</span>
            <span className="divider-dot"></span>
          </div>

          {/* Email Option */}
          <div className="email-option">
            <button className="email-link" onClick={handleEmailAuth}>
              {mode === 'signup' ? 'Create Account with Email' : 'Advanced Access with Email'}
            </button>
          </div>

          {/* Terms */}
          <div className="terms">
            By continuing, you agree to our
            <br />
            <button className="link-style">Terms of Service</button> and{' '}
            <button className="link-style">Privacy Policy</button>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="security-text">
              <span className="led-indicator"></span>
              <span>PROTECTED BY REPSPHERES SECURITY</span>
              <span className="led-indicator"></span>
              <span className="led-indicator"></span>
            </div>
          </div>

          {/* Loading Overlay */}
          <div className={`loading-overlay ${isLoading ? 'active' : ''}`} id="loadingOverlay">
            <svg className="loading-jewel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <defs>
                <radialGradient id="loadingGradient">
                  <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                  <stop offset="30%" style={{ stopColor: '#ff00ff', stopOpacity: 1 }} />
                  <stop offset="60%" style={{ stopColor: '#00ffff', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#ff00aa', stopOpacity: 0.9 }} />
                </radialGradient>
              </defs>
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="url(#loadingGradient)"
                strokeWidth="4"
              />
              <circle cx="24" cy="24" r="10" fill="url(#loadingGradient)" />
            </svg>
          </div>

          {/* Success Flare */}
          <div className={`success-flare ${showSuccess ? 'active' : ''}`} id="successFlare">
            <svg viewBox="0 0 200 200">
              <defs>
                <radialGradient id="flareGradient">
                  <stop offset="0%" style={{ stopColor: '#ff00ff', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#00ffff', stopOpacity: 0.5 }} />
                  <stop offset="100%" style={{ stopColor: '#ff00aa', stopOpacity: 0 }} />
                </radialGradient>
              </defs>
              <path
                d="M100,0 L110,90 L200,100 L110,110 L100,200 L90,110 L0,100 L90,90 Z"
                fill="url(#flareGradient)"
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal;
