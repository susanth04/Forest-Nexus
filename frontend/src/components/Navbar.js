import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [showMapsDropdown, setShowMapsDropdown] = useState(false);

  // Teammate's maps app URL - hardcoded as requested
  const TEAMMATE_MAPS_URL = 'http://10.1.40.39:3000';

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/map', label: 'FRA Atlas' },
    { path: '/ocr', label: 'Data Analytics' },
    { path: '/about', label: 'Resources' },
    { path: '/contact', label: 'About' }
  ];

  const isActive = (path) => location.pathname === path;

  /**
   * Opens teammate's maps app in a new browser tab
   * CORS Caveat: This avoids iframe restrictions since it opens in a new tab
   */
  const openMapsInNewTab = () => {
    window.open(TEAMMATE_MAPS_URL, '_blank', 'noopener,noreferrer');
    setShowMapsDropdown(false);
  };

  /**
   * Navigates to the iframe route for embedded maps
   * Network Caveat: Requires the teammate's app to allow iframe embedding
   */
  const openMapsInIframe = () => {
    // Using React Router navigation to /maps route
    setShowMapsDropdown(false);
  };

  return (
    <header>
      <div className="container">
        <div className="header-content">
          <div className="logo-section">
            <img 
              src="/forest_logo.png" 
              alt="Forest Nexus Logo" 
              className="logo-image"
            />
            <div className="logo-text">
              <h1>FRA DSS</h1>
              <span>FRA Atlas & Decision Support System</span>
            </div>
          </div>
          <nav>
            <ul>
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={isActive(item.path) ? 'active' : ''}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              
              {/* Maps Dropdown Button */}
              <li className="maps-dropdown">
                <button 
                  className={`maps-btn ${isActive('/maps') ? 'active' : ''}`}
                  onClick={() => setShowMapsDropdown(!showMapsDropdown)}
                  aria-label="Open maps options"
                  aria-haspopup="true"
                  aria-expanded={showMapsDropdown}
                >
                  Maps 🗺️
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {showMapsDropdown && (
                  <div className="maps-dropdown-menu" role="menu">
                    <Link 
                      to="/maps" 
                      className="dropdown-item"
                      onClick={openMapsInIframe}
                      role="menuitem"
                      aria-label="Open maps in embedded view"
                    >
                      📱 Embed in App
                    </Link>
                    <button 
                      className="dropdown-item"
                      onClick={openMapsInNewTab}
                      role="menuitem"
                      aria-label="Open maps in new browser tab"
                    >
                      🔗 Open in New Tab
                    </button>
                  </div>
                )}
              </li>
            </ul>
          </nav>
          <div className="user-actions">
            <button className="btn-secondary">Login</button>
            <button className="btn-primary">Register</button>
          </div>
        </div>
      </div>
      
      {/* Overlay to close dropdown when clicking outside */}
      {showMapsDropdown && (
        <div 
          className="dropdown-overlay"
          onClick={() => setShowMapsDropdown(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Navbar;
