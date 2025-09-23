import React, { useState, useEffect } from 'react';

const DSS = () => {
  const [dssData, setDssData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    // Simulate API call to fetch DSS recommendations
    setTimeout(() => {
      fetch('/dss_recommendations.json')
        .then(res => res.json())
        .then(data => {
          setDssData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading DSS data:', err);
          setLoading(false);
        });
    }, 1000);
  }, []);

  const categories = ['All', 'Scheme Eligibility', 'Priority Verification', 'Resource Allocation'];
  
  const filteredRecommendations = selectedCategory === 'All' 
    ? dssData 
    : dssData.filter(item => item.category === selectedCategory);

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#64748b';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Decision Support System</h1>
          <p className="page-subtitle">
            AI-powered recommendations for FRA implementation and scheme eligibility
          </p>
        </div>
      </div>

      <div className="container">
        {/* Filter Controls */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Filter Recommendations</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: 'auto', padding: '8px 16px' }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="features">
          {filteredRecommendations.map((recommendation, index) => (
            <div key={index} className="card" style={{ margin: 0 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span className="badge badge-pending" style={{ 
                  backgroundColor: '#f1f5f9', 
                  color: '#475569' 
                }}>
                  {recommendation.category}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: getPriorityColor(recommendation.priority)
                }}>
                  {recommendation.priority} Priority
                </span>
              </div>
              
              <h3 style={{ 
                fontSize: '1.25rem', 
                marginBottom: '0.5rem',
                color: '#1e40af'
              }}>
                {recommendation.title}
              </h3>
              
              <p style={{ 
                color: '#64748b', 
                marginBottom: '1rem',
                lineHeight: '1.6'
              }}>
                {recommendation.description}
              </p>
              
              <div style={{ 
                background: '#f8fafc', 
                padding: '1rem', 
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                <strong>Target:</strong> {recommendation.target}
              </div>
              
              {recommendation.actions && (
                <div>
                  <strong style={{ color: '#1e40af' }}>Recommended Actions:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {recommendation.actions.map((action, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {recommendation.estimated_impact && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem',
                  background: '#ecfdf5',
                  borderRadius: '6px',
                  borderLeft: '4px solid #10b981'
                }}>
                  <strong>Estimated Impact:</strong> {recommendation.estimated_impact}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '1.125rem' }}>
              No recommendations found for the selected category.
            </p>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="card">
          <h3 className="section-title">DSS Analytics</h3>
          <div className="features">
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#ef4444', fontSize: '2rem' }}>
                {dssData.filter(d => d.priority === 'High').length}
              </h3>
              <p>High Priority Actions</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#10b981', fontSize: '2rem' }}>
                {dssData.filter(d => d.category === 'Scheme Eligibility').length}
              </h3>
              <p>Scheme Recommendations</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#3b82f6', fontSize: '2rem' }}>
                {dssData.length}
              </h3>
              <p>Total Recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSS;