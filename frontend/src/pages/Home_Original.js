import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from '../components/Footer';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2 }) => {
  const [count, setCount] = React.useState(0);
  const { ref, inView } = useInView({ threshold: 0.3 });

  useEffect(() => {
    if (inView) {
      let startTime = null;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        
        const currentCount = Math.floor(progress * end);
        setCount(currentCount);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

// Parallax Hero Component
const ParallaxHero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -25]);

  return (
    <section className="hero parallax-hero">
      <motion.div 
        className="hero-bg" 
        style={{ 
          y: y1,
          backgroundImage: 'url(/forest-cover.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} 
      />
      <motion.div className="hero-overlay" style={{ y: y2 }} />
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="hero-content"
        >
          {/* Forest Logo as Cover Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="hero-logo-cover"
          >
            <img 
              src="/forest_logo.png" 
              alt="Forest Nexus Logo" 
              className="forest-cover-logo"
            />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            AI-Powered{' '}
            <motion.span
              className="highlight-text"
              initial={{ backgroundPosition: '200% 0' }}
              animate={{ backgroundPosition: '0% 0' }}
              transition={{ duration: 1.5, delay: 1 }}
            >
              FRA Atlas
            </motion.span>{' '}
            & WebGIS Monitoring Platform
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Integrated monitoring of Forest Rights Act implementation across Madhya Pradesh, 
            Tripura, Odisha, and Telangana. Digitizing legacy records, mapping forest assets with AI, 
            and enabling data-driven decision making for tribal welfare through CSS scheme integration.
          </motion.p>
          
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/map" className="btn-primary hero-btn">
                <span>Explore FRA Atlas</span>
                <motion.div className="btn-arrow" initial={{ x: 0 }} whileHover={{ x: 5 }}>
                  →
                </motion.div>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/ocr" className="btn-secondary hero-btn">
                Document Digitization
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Floating Forest Elements */}
      <motion.div
        className="floating-forest-elements"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 1 }}
      >
        <motion.div
          className="floating-leaf leaf-1"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
            x: [0, 10, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          🍃
        </motion.div>
        
        <motion.div
          className="floating-leaf leaf-2"
          animate={{
            y: [0, 15, 0],
            rotate: [0, -3, 0],
            x: [0, -8, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }}
        >
          🌿
        </motion.div>
        
        <motion.div
          className="floating-leaf leaf-3"
          animate={{
            y: [0, -25, 0],
            rotate: [0, 8, 0],
            x: [0, 12, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
        >
          🍃
        </motion.div>
      </motion.div>
    </section>
  );
};

const Home = () => {
  
  const focusStates = [
    {
      name: 'Madhya Pradesh',
      processed: 456231,
      granted: 389452,
      rate: '82.5%',
      color: '#22c55e',
      ifr: 125000,
      cr: 8500,
      cfr: 2100
    },
    {
      name: 'Odisha',
      processed: 312897,
      granted: 245673,
      rate: '76.8%',
      color: '#3b82f6',
      ifr: 98000,
      cr: 6200,
      cfr: 1800
    },
    {
      name: 'Telangana',
      processed: 287654,
      granted: 201358,
      rate: '72.3%',
      color: '#f59e0b',
      ifr: 75000,
      cr: 4100,
      cfr: 1200
    },
    {
      name: 'Tripura',
      processed: 188585,
      granted: 155671,
      rate: '79.4%',
      color: '#ef4444',
      ifr: 45000,
      cr: 3200,
      cfr: 900
    }
  ];

  const aiTechComponents = [
    {
      icon: '🤖',
      title: 'AI-Powered Data Digitization',
      description: 'Advanced NER models extract and standardize text from legacy FRA documents, identifying village names, patta holders, coordinates, and claim status.',
      features: ['OCR Processing', 'Named Entity Recognition', 'Data Standardization']
    },
    {
      icon: '🛰️',
      title: 'Satellite-based Asset Mapping',
      description: 'Computer Vision and ML models analyze high-resolution imagery to detect agricultural land, forest cover, water bodies, and homesteads.',
      features: ['Random Forest Classification', 'CNN-based Detection', 'Land-use Analysis']
    },
    {
      icon: '�️',
      title: 'Interactive WebGIS Portal',
      description: 'Comprehensive visualization platform with interactive layers for IFR/CR/CFR, village boundaries, and FRA progress tracking.',
      features: ['Multi-layer Visualization', 'Real-time Filtering', 'Progress Tracking']
    },
    {
      icon: '⚡',
      title: 'AI-Enhanced Decision Support',
      description: 'Rule-based DSS engine cross-links FRA holders with CSS scheme eligibility and prioritizes targeted interventions.',
      features: ['Scheme Layering', 'Priority Analysis', 'Policy Recommendations']
    }
  ];

  const cssSchemes = [
    {
      name: 'PM-KISAN',
      beneficiaries: 95420,
      integrated: true,
      ministry: 'Agriculture & Farmers Welfare'
    },
    {
      name: 'Jal Jeevan Mission',
      beneficiaries: 78650,
      integrated: true,
      ministry: 'Jal Shakti'
    },
    {
      name: 'MGNREGA',
      beneficiaries: 156800,
      integrated: true,
      ministry: 'Rural Development'
    },
    {
      name: 'DAJGUA Schemes',
      beneficiaries: 45230,
      integrated: false,
      ministry: 'Multi-Ministry Initiative'
    }
  ];

  const deliverables = [
    {
      title: 'Digital FRA Archive',
      description: 'AI-processed repository of all FRA claims, verifications, and decisions',
      status: 'active',
      progress: 85
    },
    {
      title: 'Interactive FRA Atlas',
      description: 'WebGIS platform showing potential and granted FRA areas',
      status: 'active',
      progress: 92
    },
    {
      title: 'AI Asset Maps',
      description: 'Comprehensive asset mapping for all FRA villages using satellite data',
      status: 'processing',
      progress: 68
    }
  ];

  // GSAP Animations
  useEffect(() => {
    // Scroll-triggered animations
    ScrollTrigger.batch('.feature-card', {
      onEnter: (elements) => {
        gsap.fromTo(elements, 
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out' }
        );
      },
      start: 'top 80%'
    });

    ScrollTrigger.batch('.state-card', {
      onEnter: (elements) => {
        gsap.fromTo(elements,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)' }
        );
      },
      start: 'top 85%'
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <div className="modern-home">
      {/* Parallax Hero Section */}
      <ParallaxHero />

      {/* Animated Features Section */}
      <motion.section 
        className="features modern-section"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="container">
          <motion.div className="section-title" variants={fadeInUp}>
            <h2>AI-Powered Technology Components</h2>
            <p>Advanced AI/ML solutions for digitizing legacy records, mapping forest assets, and enabling intelligent decision support</p>
          </motion.div>
          
          <div className="features-grid modern-grid">
            {aiTechComponents.map((component, index) => (
              <motion.div
                key={index}
                className="feature-card modern-card"
                variants={fadeInUp}
                whileHover={{ 
                  y: -10, 
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="feature-icon modern-icon"
                  whileHover={{ 
                    scale: 1.2, 
                    rotate: 10,
                    transition: { duration: 0.3 }
                  }}
                >
                  {component.icon}
                </motion.div>
                <h3>{component.title}</h3>
                <p>{component.description}</p>
                <div className="tech-features">
                  {component.features.map((feature, idx) => (
                    <span key={idx} className="tech-badge">{feature}</span>
                  ))}
                </div>
                <motion.div 
                  className="card-glow"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Interactive Map Section */}
      <motion.section 
        className="map-section modern-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1 }}
      >
        <div className="container">
          <motion.div 
            className="section-title"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2>WebGIS-based FRA Atlas</h2>
            <p>Interactive mapping platform for forest rights visualization across Madhya Pradesh, Tripura, Odisha, and Telangana with real-time data integration</p>
          </motion.div>
          
          <motion.div 
            className="map-container modern-map"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="map-placeholder">
              <motion.i 
                className="fas fa-map"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <h3>Interactive WebGIS Map</h3>
              <p>This area will contain the interactive map component</p>
            </div>
            
            <motion.div 
              className="map-controls modern-controls"
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4>Map Layers</h4>
              <ul className="layer-list">
                {[
                  'Individual Forest Rights (IFR)',
                  'Community Rights (CR)',
                  'Community Forest Resource (CFR)',
                  'Forest Cover',
                  'Water Bodies'
                ].map((layer, index) => (
                  <motion.li 
                    key={index}
                    className="layer-item"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <input 
                      type="checkbox" 
                      id={`layer-${index}`} 
                      defaultChecked={index < 2} 
                    />
                    <label htmlFor={`layer-${index}`}>{layer}</label>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Dashboard Section with Animated Stats */}
      <motion.section 
        className="dashboard modern-section"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
      >
        <div className="container">
          <motion.div className="section-title" variants={fadeInUp}>
            <h2>FRA Implementation Dashboard</h2>
            <p>Real-time statistics and progress monitoring</p>
          </motion.div>
          
          <motion.div className="stats-grid modern-stats" variants={staggerContainer}>
            {[
              { number: 1245367, label: 'Total FRA Claims Processed' },
              { number: 892154, label: 'Individual Forest Rights Granted' },
              { number: 15892, label: 'Community Rights Recognized' },
              { number: 78, label: 'Overall Implementation Rate', suffix: '%' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card modern-stat-card"
                variants={scaleIn}
                whileHover={{ 
                  y: -5,
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
              >
                <motion.div className="stat-number">
                  <AnimatedCounter end={stat.number} />
                  {stat.suffix && <span>{stat.suffix}</span>}
                </motion.div>
                <div className="stat-label">{stat.label}</div>
                <motion.div 
                  className="stat-progress"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div className="section-title" variants={fadeInUp}>
            <h3>State-wise Implementation</h3>
          </motion.div>
          
          <motion.div className="state-cards modern-state-grid" variants={staggerContainer}>
            {focusStates.map((state, index) => (
              <motion.div
                key={index}
                className="state-card modern-state-card"
                variants={fadeInUp}
                whileHover={{ 
                  y: -8,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                style={{ '--accent-color': state.color }}
              >
                <div className="state-header">
                  <h3>{state.name}</h3>
                  <motion.div 
                    className="state-indicator"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </div>
                <div className="state-body">
                  <div className="state-stat">
                    <span>Total Claims:</span>
                    <span><AnimatedCounter end={state.processed} /></span>
                  </div>
                  <div className="state-stat">
                    <span>Rights Granted:</span>
                    <span><AnimatedCounter end={state.granted} /></span>
                  </div>
                  <div className="state-stat">
                    <span>IFR Pattas:</span>
                    <span><AnimatedCounter end={state.ifr} /></span>
                  </div>
                  <div className="state-stat">
                    <span>CR Pattas:</span>
                    <span><AnimatedCounter end={state.cr} /></span>
                  </div>
                  <div className="state-stat">
                    <span>CFR Pattas:</span>
                    <span><AnimatedCounter end={state.cfr} /></span>
                  </div>
                  <div className="state-stat">
                    <span>Implementation Rate:</span>
                    <span className="rate-highlight">{state.rate}</span>
                  </div>
                </div>
                <motion.div 
                  className="state-glow"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CSS Schemes Integration Section */}
      <motion.section 
        className="css-schemes modern-section"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="container">
          <motion.div className="section-title" variants={fadeInUp}>
            <h2>Central Sector Schemes Integration</h2>
            <p>Seamless integration with CSS schemes for comprehensive tribal welfare delivery</p>
          </motion.div>
          
          <motion.div className="css-grid modern-grid" variants={staggerContainer}>
            {cssSchemes.map((scheme, index) => (
              <motion.div
                key={index}
                className="css-card modern-card"
                variants={fadeInUp}
                whileHover={{ 
                  y: -10, 
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="css-header">
                  <h3>{scheme.name}</h3>
                  <div className={`integration-status ${scheme.integrated ? 'integrated' : 'pending'}`}>
                    {scheme.integrated ? '✓ Integrated' : '⏳ In Progress'}
                  </div>
                </div>
                <div className="css-body">
                  <div className="css-stat">
                    <span>FRA Beneficiaries:</span>
                    <span className="beneficiary-count">
                      <AnimatedCounter end={scheme.beneficiaries} />
                    </span>
                  </div>
                  <div className="css-ministry">
                    <span>Ministry: {scheme.ministry}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Project Deliverables Section */}
      <motion.section 
        className="deliverables modern-section"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="container">
          <motion.div className="section-title" variants={fadeInUp}>
            <h2>Project Deliverables</h2>
            <p>Comprehensive AI-powered solutions for FRA implementation monitoring</p>
          </motion.div>
          
          <motion.div className="deliverables-grid modern-grid" variants={staggerContainer}>
            {deliverables.map((item, index) => (
              <motion.div
                key={index}
                className="deliverable-card modern-card"
                variants={fadeInUp}
                whileHover={{ 
                  y: -10, 
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="deliverable-header">
                  <h3>{item.title}</h3>
                  <div className={`status-indicator ${item.status}`}>
                    {item.status === 'active' ? '🟢' : item.status === 'processing' ? '🟡' : '🔴'}
                  </div>
                </div>
                <p>{item.description}</p>
                <div className="progress-section">
                  <div className="progress-label">
                    <span>Progress</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <motion.div 
                      className="progress-bar"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Target Users Section */}
      <motion.section 
        className="target-users modern-section"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="container">
          <motion.div className="section-title" variants={fadeInUp}>
            <h2>Target Users & Stakeholders</h2>
            <p>Empowering key stakeholders in FRA implementation and tribal welfare</p>
          </motion.div>
          
          <motion.div className="users-grid" variants={staggerContainer}>
            {[
              { title: 'Ministry of Tribal Affairs', icon: '🏛️', desc: 'Central policy formulation and monitoring' },
              { title: 'District Tribal Welfare Departments', icon: '🏢', desc: 'Ground-level implementation and coordination' },
              { title: 'Forest & Revenue Departments', icon: '🌲', desc: 'Land verification and forest management' },
              { title: 'Planning & Development Authorities', icon: '📋', desc: 'Strategic planning and resource allocation' },
              { title: 'DAJGUA Line Departments', icon: '🤝', desc: 'Inter-ministerial scheme coordination' },
              { title: 'NGOs & Tribal Communities', icon: '👥', desc: 'Community engagement and grassroots support' }
            ].map((user, index) => (
              <motion.div
                key={index}
                className="user-card modern-card"
                variants={fadeInUp}
                whileHover={{ 
                  y: -5, 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="user-icon">{user.icon}</div>
                <h3>{user.title}</h3>
                <p>{user.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;