import React, { useState, useEffect } from 'react';

const DSS = () => {
  const [dssData, setDssData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    // Fetch DSS recommendations from the JSON file
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: 'white'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#111827', color: 'white', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'white'
          }}>
            Decision Support System
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#d1d5db',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            AI-powered recommendations for Forest Rights Act implementation and scheme eligibility
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ 
          background: '#1f2937', 
          borderRadius: '12px', 
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #374151'
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'white', fontSize: '1.5rem' }}>Filter Recommendations</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: selectedCategory === category 
                    ? 'linear-gradient(135deg, #4ade80, #22d3ee)' 
                    : '#374151',
                  color: 'white',
                  minWidth: 'auto'
                }}
                onMouseOver={(e) => {
                  if (selectedCategory !== category) {
                    e.target.style.background = '#4b5563';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedCategory !== category) {
                    e.target.style.background = '#374151';
                  }
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {filteredRecommendations.map((recommendation, index) => (
            <div key={index} style={{ 
              background: '#1f2937', 
              borderRadius: '12px', 
              padding: '2rem',
              border: '1px solid #374151',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{ 
                  background: '#374151',
                  color: '#d1d5db',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  {recommendation.category}
                </span>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: getPriorityColor(recommendation.priority)
                }}>
                  {recommendation.priority} Priority
                </span>
              </div>
              
              <h3 style={{ 
                fontSize: '1.4rem', 
                marginBottom: '1rem',
                color: '#4ade80',
                fontWeight: '600'
              }}>
                {recommendation.title}
              </h3>
              
              <p style={{ 
                color: '#d1d5db', 
                marginBottom: '1.5rem',
                lineHeight: '1.6',
                fontSize: '1rem'
              }}>
                {recommendation.description}
              </p>
              
              <div style={{ 
                background: '#111827', 
                padding: '1rem', 
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: '1px solid #374151'
              }}>
                <strong style={{ color: 'white' }}>Target:</strong>
                <span style={{ color: '#d1d5db', marginLeft: '0.5rem' }}>
                  {recommendation.target}
                </span>
              </div>
              
              {recommendation.actions && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <strong style={{ color: '#4ade80', marginBottom: '0.5rem', display: 'block' }}>
                    Recommended Actions:
                  </strong>
                  <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                    {recommendation.actions.map((action, idx) => (
                      <li key={idx} style={{ 
                        marginBottom: '0.5rem', 
                        color: '#d1d5db',
                        lineHeight: '1.4'
                      }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {recommendation.estimated_impact && (
                <div style={{ 
                  padding: '1rem',
                  background: 'rgba(74, 222, 128, 0.1)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #4ade80'
                }}>
                  <strong style={{ color: 'white' }}>Estimated Impact:</strong>
                  <p style={{ color: '#d1d5db', margin: '0.5rem 0 0 0' }}>
                    {recommendation.estimated_impact}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <div style={{ 
            background: '#1f2937', 
            borderRadius: '12px', 
            padding: '3rem',
            textAlign: 'center',
            border: '1px solid #374151'
          }}>
            <p style={{ color: '#d1d5db', fontSize: '1.2rem' }}>
              No recommendations found for the selected category.
            </p>
          </div>
        )}

        {/* Summary Statistics */}
        <div style={{ 
          background: '#1f2937', 
          borderRadius: '12px', 
          padding: '2rem',
          border: '1px solid #374151'
        }}>
          <h3 style={{ 
            fontSize: '1.8rem', 
            marginBottom: '2rem', 
            color: 'white',
            textAlign: 'center'
          }}>
            DSS Analytics
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '2rem' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                color: '#ef4444', 
                fontSize: '3rem',
                margin: '0 0 0.5rem 0',
                fontWeight: 'bold'
              }}>
                {dssData.filter(d => d.priority === 'High').length}
              </h3>
              <p style={{ color: '#d1d5db', fontSize: '1.1rem' }}>High Priority Actions</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                color: '#4ade80', 
                fontSize: '3rem',
                margin: '0 0 0.5rem 0',
                fontWeight: 'bold'
              }}>
                {dssData.filter(d => d.category === 'Scheme Eligibility').length}
              </h3>
              <p style={{ color: '#d1d5db', fontSize: '1.1rem' }}>Scheme Recommendations</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                color: '#22d3ee', 
                fontSize: '3rem',
                margin: '0 0 0.5rem 0',
                fontWeight: 'bold'
              }}>
                {dssData.length}
              </h3>
              <p style={{ color: '#d1d5db', fontSize: '1.1rem' }}>Total Recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DSS;