import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './LoginModal.css';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);
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

    // Animate screws
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

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
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
        {/* Logout Modal */}
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
                    <stop offset="0%" style={{ stopColor: '#f53969', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ff6b35', stopOpacity: 1 }} />
                  </linearGradient>
                  <radialGradient id="jewelGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                    <stop offset="30%" style={{ stopColor: '#f53969', stopOpacity: 1 }} />
                    <stop offset="60%" style={{ stopColor: '#ff6b35', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#f53969', stopOpacity: 0.9 }} />
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
                <circle cx="32" cy="8" r="3" fill="#f53969" opacity="0.8" />
                <circle cx="56" cy="32" r="3" fill="#ff6b35" opacity="0.8" />
                <circle cx="32" cy="56" r="3" fill="#f53969" opacity="0.8" />
                <circle cx="8" cy="32" r="3" fill="#ff6b35" opacity="0.8" />
              </svg>
            </div>
            <h1 className="logo-title">Sign Out</h1>
            <p className="logo-subtitle">Confirm RepSpheres Session Termination</p>
          </div>

          {/* Logout Message */}
          <div className="auth-section">
            <p
              style={{
                color: '#fff',
                textAlign: 'center',
                fontSize: '1.1rem',
                marginBottom: '2rem',
                lineHeight: '1.5',
              }}
            >
              Are you sure you want to sign out of your RepSpheres account?
              <br />
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                You'll need to authenticate again to access all RepSpheres services.
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="auth-section">
            <button
              className="social-btn facebook"
              onClick={handleClose}
              style={{ marginBottom: '1rem' }}
            >
              <span>Cancel</span>
            </button>

            <button
              className="social-btn google"
              onClick={handleConfirm}
              disabled={isLoading}
              style={{
                background: 'linear-gradient(90deg, #f53969 0%, #ff6b35 100%)',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="security-text">
              <span className="led-indicator"></span>
              <span>REPSPHERES SECURITY PROTOCOL</span>
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
                  <stop offset="30%" style={{ stopColor: '#f53969', stopOpacity: 1 }} />
                  <stop offset="60%" style={{ stopColor: '#ff6b35', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#f53969', stopOpacity: 0.9 }} />
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
        </div>
      </div>
    </>
  );
};

export default LogoutModal;
