import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Simple Hero Component - Clean Design
const SimpleHero = () => {
  return (
    <section className="simple-hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      
      <div className="hero-container">
        <motion.div
          className="hero-content-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <motion.h1
            className="hero-main-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Empowering Forest Communities with AI-driven FRA Solutions
          </motion.h1>
          
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Leveraging advanced AI and WebGIS for sustainable forest management and tribal rights protection.
          </motion.p>
          
          <motion.div
            className="hero-buttons-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link to="/maps" className="btn-explore">
              Explore Map
            </Link>
            <Link to="/dss" className="btn-view-dss">
              View DSS
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const Home = () => {
  return (
    <div className="modern-home">
      <SimpleHero />
    </div>
  );
};

export default Home;