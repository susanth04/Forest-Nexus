import React, { useState } from 'react';
import './Claims.css';

const Claims = () => {
  const [claimType, setClaimType] = useState('');
  const [claimantName, setClaimantName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Claim submission feature coming soon!');
  };

  return (
    <div className="claims-container">
      <div className="claims-content">
        <div className="claims-header">
          <h1 className="claims-title">📋 Forest Rights Claims</h1>
          <p className="claims-subtitle">Submit and track your forest rights claims</p>
        </div>

        <div className="claims-grid">
          {/* Submit New Claim Card */}
          <div className="claim-card">
            <h2 className="card-title">Submit New Claim</h2>
            <form onSubmit={handleSubmit} className="claim-form">
              <div className="form-group">
                <label htmlFor="claimType">Claim Type</label>
                <select 
                  id="claimType" 
                  value={claimType} 
                  onChange={(e) => setClaimType(e.target.value)}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="individual">Individual Forest Rights</option>
                  <option value="community">Community Forest Rights</option>
                  <option value="habitat">Habitat Rights</option>
                  <option value="minor">Minor Forest Produce</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="claimantName">Claimant Name</label>
                <input
                  type="text"
                  id="claimantName"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Forest Location</label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter forest area/village name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Claim Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your claim in detail"
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="documents">Supporting Documents</label>
                <input
                  type="file"
                  id="documents"
                  onChange={(e) => setDocuments(e.target.files)}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <small className="file-hint">Upload relevant documents (PDF, Images, Word)</small>
              </div>

              <button type="submit" className="submit-btn">
                Submit Claim
              </button>
            </form>
          </div>

          {/* Track Existing Claims Card */}
          <div className="claim-card">
            <h2 className="card-title">Track Your Claims</h2>
            <div className="track-section">
              <div className="track-input-group">
                <input
                  type="text"
                  placeholder="Enter Claim ID or Mobile Number"
                  className="track-input"
                />
                <button className="track-btn">Track Status</button>
              </div>

              <div className="claim-stats">
                <div className="stat-card">
                  <span className="stat-number">1,247</span>
                  <span className="stat-label">Total Claims</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">892</span>
                  <span className="stat-label">Approved</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">213</span>
                  <span className="stat-label">Pending</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">142</span>
                  <span className="stat-label">Under Review</span>
                </div>
              </div>

              <div className="recent-claims">
                <h3>Recent Submissions</h3>
                <ul className="claims-list">
                  <li className="claim-item">
                    <span className="claim-id">FRA2024001</span>
                    <span className="claim-status approved">Approved</span>
                  </li>
                  <li className="claim-item">
                    <span className="claim-id">FRA2024002</span>
                    <span className="claim-status pending">Pending</span>
                  </li>
                  <li className="claim-item">
                    <span className="claim-id">FRA2024003</span>
                    <span className="claim-status review">Under Review</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Claims;
