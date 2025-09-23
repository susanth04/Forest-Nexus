import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <div className="footer-logo-section">
              <img 
                src="/forest-nexus-logo.png" 
                alt="Forest Nexus Logo" 
                className="footer-logo-image"
              />
              <div className="footer-brand">
                <h3>Forest Nexus</h3>
                <p>An initiative by the Ministry of Tribal Affairs to monitor and support the implementation of the Forest Rights Act, 2006.</p>
              </div>
            </div>
          </div>
          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/map">FRA Atlas</Link></li>
              <li><Link to="/ocr">Data Analytics</Link></li>
              <li><Link to="/about">Resources</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>States Covered</h3>
            <ul className="footer-links">
              <li><span>Madhya Pradesh</span></li>
              <li><span>Odisha</span></li>
              <li><span>Telangana</span></li>
              <li><span>Tripura</span></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Contact Us</h3>
            <ul className="footer-links">
              <li>📧 fra.atlas@tribal.gov.in</li>
              <li>📞 +91-11-1234-5678</li>
              <li>📍 Ministry of Tribal Affairs, New Delhi</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2023 Ministry of Tribal Affairs, Government of India. All rights reserved.</p>
          <div className="footer-logo-small">
            <img 
              src="/forest-nexus-logo.png" 
              alt="Forest Nexus" 
              className="footer-logo-small-image"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;