import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <p className="eyebrow">Empowering communities through</p>
            <h1 className="headline">Forest Rights & Land Security</h1>
            <p className="hero-description">
              Advanced technology solutions for transparent land rights management and community empowerment.
            </p>
            <div className="hero-buttons">
              <Link to="/claims" className="btn btn-primary">Submit Claim</Link>
              <Link to="/webgis" className="btn btn-secondary">Explore Maps</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Solutions</h2>
            <p className="section-subtitle">
              Professional tools for forest rights management and land security.
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#39ff88" strokeWidth="1.5"/>
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#39ff88" strokeWidth="1.5"/>
                  <path d="M12 3V9M12 15V21M3 12H9M15 12H21" stroke="#39ff88" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 className="feature-title">WebGIS Platform</h3>
              <p className="feature-description">
                Interactive mapping for land claims and forest boundaries.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#39ff88" strokeWidth="1.5"/>
                  <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="#39ff88" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 className="feature-title">OCR & DSS</h3>
              <p className="feature-description">
                Document processing and decision support systems.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#39ff88" strokeWidth="1.5"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#39ff88" strokeWidth="1.5"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#39ff88" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 className="feature-title">Community Portal</h3>
              <p className="feature-description">
                Secure platform for community claim management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>Forest Nexus</h3>
              <p>Technology-driven forest rights solutions.</p>
            </div>
            <div className="footer-column">
              <h3>Links</h3>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/services">Services</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Support</h3>
              <ul className="footer-links">
                <li><Link to="/docs">Documentation</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/help">Help</Link></li>
                <li><Link to="/privacy">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Forest Nexus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;