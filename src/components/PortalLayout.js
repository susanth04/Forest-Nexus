import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const [showMapsDropdown, setShowMapsDropdown] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleOCRDSSClick = (e) => {
    e.preventDefault();
    window.open('http://10.2.8.15:3000/', '_blank', 'noopener,noreferrer');
  };

  const handleDataVisualizationClick = (e) => {
    e.preventDefault();
    window.open('http://localhost:3001/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="portal-layout">
      <header>
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">🌲</span>
              </div>
              <div className="logo-text">
                <h1>FRA Atlas</h1>
                <span>Forest Rights Act Portal</span>
              </div>
            </div>
            
            <nav>
              <ul>
                <li>
                  <Link 
                    to="/" 
                    className={isActive('/') ? 'active' : ''}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/claims" 
                    className={isActive('/claims') ? 'active' : ''}
                  >
                    Claims
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/webgis" 
                    className={isActive('/webgis') ? 'active' : ''}
                  >
                    WebGIS
                  </Link>
                </li>
                <li>
                  <a 
                    href="#"
                    onClick={handleOCRDSSClick}
                    className="external-link"
                  >
                    OCR & DSS Analytics
                  </a>
                </li>
                <li>
                  <a 
                    href="#"
                    onClick={handleDataVisualizationClick}
                    className="external-link data-viz"
                  >
                    📊 Data Visualization
                  </a>
                </li>
                <li>
                  <Link 
                    to="/insights" 
                    className={isActive('/insights') ? 'active' : ''}
                  >
                    Insights
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/disputes" 
                    className={isActive('/disputes') ? 'active' : ''}
                  >
                    Disputes
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/resources" 
                    className={isActive('/resources') ? 'active' : ''}
                  >
                    Resources
                  </Link>
                </li>
              </ul>
            </nav>
            
            <div className="auth-section">
              <button className="login-btn">
                <span>👤</span>
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="portal-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;