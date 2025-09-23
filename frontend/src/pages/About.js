

import React from 'react';

const About = () => {
  const teamMembers = [
    { name: 'Susanth Kumar', role: 'Full Stack Developer', expertise: 'React, Node.js, GIS' },
    { name: 'Team Member 2', role: 'AI/ML Engineer', expertise: 'OCR, Computer Vision' },
    { name: 'Team Member 3', role: 'GIS Specialist', expertise: 'WebGIS, Remote Sensing' },
    { name: 'Team Member 4', role: 'UI/UX Designer', expertise: 'User Experience, Design' }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">About FRA Atlas & DSS</h1>
          <p className="page-subtitle">
            Building technology solutions for tribal rights and forest conservation
          </p>
        </div>
      </div>

      <div className="container">
        {/* Problem Statement */}
        <section className="section">
          <div className="card">
            <h2 className="section-title">🎯 Problem Statement</h2>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              The Forest Rights Act (FRA) 2006 aimed to recognize and vest forest rights to tribal 
              communities, but implementation faces significant challenges:
            </p>
            <ul style={{ fontSize: '1.1rem', lineHeight: '1.8', paddingLeft: '2rem' }}>
              <li><strong>Scattered Records:</strong> FRA claims exist in paper format across different offices</li>
              <li><strong>No Integrated Atlas:</strong> Lack of centralized mapping system for claims and assets</li>
              <li><strong>Manual Verification:</strong> Time-consuming and error-prone verification processes</li>
              <li><strong>Limited Decision Support:</strong> No AI-powered recommendations for scheme eligibility</li>
              <li><strong>Poor Accessibility:</strong> Tribal communities have limited access to their own data</li>
            </ul>
          </div>
        </section>

        {/* Solution */}
        <section className="section">
          <div className="card">
            <h2 className="section-title">💡 Our Solution</h2>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              We present an integrated AI-powered platform that combines three core technologies:
            </p>
            
            <div className="features">
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ color: '#1e40af', marginBottom: '1rem' }}>🔍 OCR Technology</h4>
                <p>
                  Advanced Optical Character Recognition extracts and digitizes claim data from 
                  paper documents, making records searchable and accessible in real-time.
                </p>
              </div>
              
              <div style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: '8px' }}>
                <h4 style={{ color: '#059669', marginBottom: '1rem' }}>🗺️ WebGIS Integration</h4>
                <p>
                  Interactive mapping system visualizes FRA claims, village boundaries, and 
                  forest assets with real-time geospatial analysis and layer management.
                </p>
              </div>
              
              <div style={{ padding: '1.5rem', background: '#fefbeb', borderRadius: '8px' }}>
                <h4 style={{ color: '#d97706', marginBottom: '1rem' }}>🤖 Decision Support System</h4>
                <p>
                  AI-powered recommendations for government schemes, verification priorities, 
                  and resource allocation based on comprehensive claim analysis.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f1f5f9', borderRadius: '8px' }}>
              <h4 style={{ color: '#1e40af', marginBottom: '1rem' }}>🎯 Key Benefits</h4>
              <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                <li>Centralized digital repository for all FRA claims</li>
                <li>Real-time mapping and spatial analysis capabilities</li>
                <li>Automated scheme eligibility recommendations</li>
                <li>Streamlined verification and approval workflows</li>
                <li>Enhanced transparency and accessibility for tribal communities</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Future Scope */}
        <section className="section">
          <div className="card">
            <h2 className="section-title">🚀 Future Scope</h2>
            <div className="features">
              <div>
                <h4 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>IoT Integration</h4>
                <p>Deploy IoT sensors for real-time forest monitoring, soil quality assessment, and environmental data collection.</p>
              </div>
              
              <div>
                <h4 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Satellite Feeds</h4>
                <p>Integrate real-time satellite imagery for land use change detection, deforestation monitoring, and crop assessment.</p>
              </div>
              
              <div>
                <h4 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Multi-State Scaling</h4>
                <p>Expand the platform to cover multiple states with standardized data formats and inter-state collaboration features.</p>
              </div>
              
              <div>
                <h4 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Mobile Application</h4>
                <p>Develop mobile apps for field workers and tribal communities to submit claims and access information offline.</p>
              </div>
              
              <div>
                <h4 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Blockchain Integration</h4>
                <p>Implement blockchain for immutable record keeping and transparent claim verification processes.</p>
              </div>
              
              <div>
                <h4 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Advanced Analytics</h4>
                <p>Machine learning models for predictive analytics, pattern recognition, and automated anomaly detection.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="section">
          <div className="card">
            <h2 className="section-title">👥 Our Team</h2>
            <div className="features">
              {teamMembers.map((member, index) => (
                <div key={index} style={{ 
                  textAlign: 'center', 
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    fontSize: '1.5rem',
                    color: 'white'
                  }}>
                    👤
                  </div>
                  <h4 style={{ marginBottom: '0.5rem' }}>{member.name}</h4>
                  <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>{member.role}</p>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{member.expertise}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="section">
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 className="section-title">📧 Get In Touch</h2>
            <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
              Interested in collaborating or learning more about our solution?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="mailto:team@fra-atlas.gov.in" className="btn btn-primary">
                Email Us
              </a>
              <a href="https://github.com/susanth04/Forest-Nexus" className="btn btn-secondary">
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;