import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="nav">
      <div className="wrap">
        <Link className="brand" to="/">FOREST NEXUS</Link>
        
        {/* Mobile menu button */}
        <button className="menu-toggle" onClick={toggleMenu}>
          <span className="menu-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        <ul className={`menu ${isMenuOpen ? 'menu-open' : ''}`}>
          <li><Link to="/" onClick={closeMenu}>Home</Link></li>
          <li><Link to="/claims" onClick={closeMenu}>Claims</Link></li>
          <li><Link to="/webgis" onClick={closeMenu}>WebGIS</Link></li>
          <li><Link to="/ocr-dss" onClick={closeMenu}>OCR & DSS</Link></li>
          <li><Link className="login" to="/login" onClick={closeMenu}>Login</Link></li>
        </ul>
      </div>
    </header>
  );
};

export default Navbar;