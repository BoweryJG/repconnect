import React, { useState, useEffect } from 'react';
import './RepSpheresNavbar.css';

const RepSpheresNavbar = ({
  onLogin,
  onSignup,
  onLogout,
  user = null,
  appLinks = [], // App-specific links go in the more menu
  logoHref = '/',
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [telemetryStatus, setTelemetryStatus] = useState(0);

  // Default ecosystem navigation links
  const ecosystemLinks = [
    { href: 'https://marketdata.repspheres.com/', label: 'Market Data', icon: 'market' },
    { href: 'https://canvas.repspheres.com/', label: 'Canvas', icon: 'canvas' },
    { href: 'https://repconnect.repspheres.com/', label: 'RepConnect', icon: 'pipeline' },
    { href: 'https://crm.repspheres.com/', label: 'CRM', icon: 'sphere' },
    { href: 'https://podcast.repspheres.com/', label: 'Podcasts', icon: 'podcasts' },
  ];

  // Telemetry status messages
  const statusMessages = [
    '⏱ AI SYNC 97%',
    '🔗 NEURAL LINK ACTIVE',
    '⚡ QUANTUM CORE 100%',
    '📊 DATA STREAM LIVE',
    '🛡️ SECURITY OPTIMAL',
    '🌐 NETWORK STABLE',
    '💎 GEMS ALIGNED',
    '🔮 PREDICTION MODE',
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryStatus((prev) => (prev + 1) % statusMessages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [statusMessages.length]);

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    // Close more menu when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.nav-more-menu-wrapper')) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMoreMenuOpen]);

  const handleLinkClick = (e, link) => {
    const href = link.href;

    // Handle custom onClick if provided
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
      setIsMobileMenuOpen(false);
      setIsMoreMenuOpen(false);
      return;
    }

    // If it's a hash link, handle smooth scroll
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (href.startsWith('https://')) {
      // External links open in new tab
      window.open(href, '_blank', 'noopener,noreferrer');
      e.preventDefault();
    }
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      <div className={`repspheres-header-container ${isScrolled ? 'scrolled' : ''}`}>
        <nav className="repspheres-nav-container">
          {/* Edge Mount Indicators */}
          <div className="nav-edge left-edge"></div>
          <div className="nav-edge right-edge"></div>

          {/* Metallic Screws */}
          <div className="nav-screws">
            <div className="screw-wrapper screw-wrapper-top-left">
              <div className="screw">
                <div className="screw-jewel"></div>
              </div>
            </div>
            <div className="screw-wrapper screw-wrapper-top-right">
              <div className="screw">
                <div className="screw-jewel"></div>
              </div>
            </div>
            <div className="screw-wrapper screw-wrapper-bot-left">
              <div className="screw">
                <div className="screw-jewel"></div>
              </div>
            </div>
            <div className="screw-wrapper screw-wrapper-bot-right">
              <div className="screw">
                <div className="screw-jewel"></div>
              </div>
            </div>
          </div>

          <div className="nav-inner">
            {/* Logo */}
            <a href={logoHref} className="nav-logo">
              <div className="nav-logo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                  <defs>
                    <linearGradient id="sphereGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9f58fa" />
                      <stop offset="100%" stopColor="#4B96DC" />
                    </linearGradient>
                    <radialGradient id="jewelGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                      <stop offset="30%" stopColor="#ff00ff" stopOpacity="1" />
                      <stop offset="60%" stopColor="#00ffff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#ff00aa" stopOpacity="0.9" />
                    </radialGradient>
                    <filter id="glowTrail">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    stroke="url(#sphereGradient)"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="8"
                    fill="none"
                    stroke="url(#sphereGradient)"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                  <circle cx="16" cy="16" r="3" fill="url(#jewelGradient)">
                    <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
                    <animate
                      attributeName="opacity"
                      values="0.8;1;0.8"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx="16" cy="4" r="1.5" fill="#9f58fa" filter="url(#glowTrail)">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 16 16"
                      to="360 16 16"
                      dur="6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx="28" cy="16" r="1.5" fill="#4B96DC" filter="url(#glowTrail)">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 16 16"
                      to="360 16 16"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx="16" cy="28" r="1.5" fill="#4bd48e" filter="url(#glowTrail)">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 16 16"
                      to="360 16 16"
                      dur="10s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>
              <span className="nav-logo-text">RepSpheres</span>
            </a>

            {/* Desktop Navigation Links - Always show ecosystem links */}
            <nav className="nav-links">
              {ecosystemLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="nav-link"
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  <span className={`nav-link-icon icon-${link.icon}`}></span>
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="nav-actions">
              {user ? (
                <>
                  <span className="nav-user-info">{user.email?.split('@')[0] || 'User'}</span>
                  <button className="nav-cta-secondary" onClick={onLogout}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button className="nav-cta-secondary" onClick={onLogin}>
                    Login
                  </button>
                  <button className="nav-cta" onClick={onSignup}>
                    Sign Up
                  </button>
                </>
              )}

              {/* More Menu - Only show if there are app links */}
              {appLinks.length > 0 && (
                <div className="nav-more-menu-wrapper">
                  <button
                    className="nav-more"
                    aria-label="More options"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMoreMenuOpen(!isMoreMenuOpen);
                    }}
                  >
                    <div className="nav-more-icon">
                      <span className="nav-more-dot"></span>
                      <span className="nav-more-dot"></span>
                      <span className="nav-more-dot"></span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isMoreMenuOpen && (
                    <div className="nav-more-dropdown">
                      {appLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.href}
                          className="nav-more-dropdown-item"
                          onClick={(e) => handleLinkClick(e, link)}
                        >
                          <span className={`nav-link-icon icon-${link.icon}`}></span>
                          <span>{link.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                className={`nav-hamburger ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <div className="hamburger-icon">
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Telemetry System */}
        <div className="telemetry-container">
          <div className="telemetry-rail-system">
            <div className="telemetry-rail-wrapper unified">
              <div className="telemetry-node left"></div>
              <div className="telemetry-status-inline">{statusMessages[telemetryStatus]}</div>
              <div className="telemetry-node right"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target.classList.contains('mobile-menu-overlay')) {
            setIsMobileMenuOpen(false);
          }
        }}
      >
        <div className="mobile-menu">
          <nav className="mobile-menu-links">
            {/* Ecosystem Links */}
            <div className="mobile-menu-section">
              <div className="mobile-menu-section-title">RepSpheres Ecosystem</div>
              {ecosystemLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="mobile-menu-link"
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  <span className={`nav-link-icon icon-${link.icon}`}></span>
                  <span>{link.label}</span>
                </a>
              ))}
            </div>

            {/* App Links */}
            {appLinks.length > 0 && (
              <div className="mobile-menu-section">
                <div className="mobile-menu-section-title">RepConnect Tools</div>
                {appLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="mobile-menu-link"
                    onClick={(e) => handleLinkClick(e, link)}
                  >
                    <span className={`nav-link-icon icon-${link.icon}`}></span>
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Auth Actions */}
            <div className="mobile-menu-section">
              {user ? (
                <button
                  className="mobile-menu-link"
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="nav-link-icon icon-logout"></span>
                  <span>Sign Out</span>
                </button>
              ) : (
                <>
                  <button
                    className="mobile-menu-link"
                    onClick={() => {
                      onLogin();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-link-icon icon-login"></span>
                    <span>Login</span>
                  </button>
                  <button
                    className="mobile-menu-link"
                    onClick={() => {
                      onSignup();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-link-icon icon-signup"></span>
                    <span>Sign Up</span>
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default RepSpheresNavbar;
