import React, { useState, useEffect } from 'react';

const OCRView = () => {
  const [ocrData, setOcrData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    // Simulate API call to fetch OCR data
    setTimeout(() => {
      fetch('/ocr_data.json')
        .then(res => res.json())
        .then(data => {
          setOcrData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading OCR data:', err);
          setLoading(false);
        });
    }, 1000);
  }, []);

  const filteredData = ocrData.filter(claim => 
    claim.holder_name.toLowerCase().includes(filter.toLowerCase()) ||
    claim.village.toLowerCase().includes(filter.toLowerCase()) ||
    claim.claim_id.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badgeClass = status === 'Approved' ? 'approved' : 
                      status === 'Pending' ? 'pending' : 'rejected';
    return <span className={`status-badge ${badgeClass}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Loading OCR data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header Section */}
      <section className="content-section">
        <div className="content-container">
          <div className="section-header">
            <h1 className="section-title">OCR Document Processing</h1>
            <p className="section-subtitle">
              Digitized Forest Rights Act claims extracted from scanned documents using advanced OCR technology
            </p>
          </div>

          {/* Search and Filters */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search by claim ID, holder name, or village..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="card">
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Holder Name</th>
                    <th>Village</th>
                    <th>Claim Type</th>
                    <th>Status</th>
                    <th>Land Size (Ha)</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((claim, index) => (
                    <tr key={index}>
                      <td>
                        <span className="claim-id">{claim.claim_id || 'NaN'}</span>
                      </td>
                      <td>{claim.holder_name || 'Not Available'}</td>
                      <td>{claim.village || 'NaN'}</td>
                      <td>{claim.claim_type || 'NaN'}</td>
                      <td>{getStatusBadge(claim.status || 'Unknown')}</td>
                      <td>{claim.land_size || 'NaN'}</td>
                      <td>
                        <span className={`confidence-score ${
                          claim.confidence > 90 ? 'high' : 
                          claim.confidence > 70 ? 'medium' : 'low'
                        }`}>
                          {claim.confidence || 'NaN'}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h3>No records found</h3>
                <p>No documents match your search criteria. Try adjusting your filters.</p>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="card">
            <h3 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
              OCR Processing Statistics
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value" style={{ color: 'var(--ocean-600)' }}>
                  {ocrData.length}
                </span>
                <span className="stat-label">Total Documents Processed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value" style={{ color: 'var(--emerald-600)' }}>
                  {ocrData.filter(d => d.confidence > 90).length}
                </span>
                <span className="stat-label">High Confidence Extractions</span>
              </div>
              <div className="stat-item">
                <span className="stat-value" style={{ color: 'var(--yellow-600)' }}>
                  {ocrData.filter(d => d.status === 'Pending').length}
                </span>
                <span className="stat-label">Pending Manual Review</span>
              </div>
              <div className="stat-item">
                <span className="stat-value" style={{ color: 'var(--red-600)' }}>
                  {ocrData.filter(d => d.confidence < 70).length}
                </span>
                <span className="stat-label">Require Verification</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OCRView;