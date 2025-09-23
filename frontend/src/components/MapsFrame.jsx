import React from 'react';

/**
 * MapsFrame Component - Displays teammate's maps app in an iframe
 * 
 * CORS/Network Caveats:
 * 1. The iframe may be blocked if the teammate's app has X-Frame-Options set to DENY/SAMEORIGIN
 * 2. If the app uses HTTPS, ensure the iframe src uses HTTPS to avoid mixed content issues
 * 3. Network connectivity: Ensure the IP address (10.1.40.39) is accessible from user's network
 * 4. Some browsers may block iframes from local/private IP addresses for security reasons
 * 5. Consider adding error handling for failed iframe loads
 */

const MapsFrame = () => {
  const TEAMMATE_MAPS_URL = 'http://10.1.40.39:3000';

  const handleIframeError = () => {
    console.warn('Failed to load teammate maps app. This could be due to CORS policy, network issues, or X-Frame-Options restrictions.');
  };

  return (
    <div className="maps-frame-container">
      <div className="maps-frame-header">
        <h2>Teammate's Maps Application</h2>
        <p>
          Loading external maps app from: <code>{TEAMMATE_MAPS_URL}</code>
        </p>
        <a 
          href={TEAMMATE_MAPS_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-primary"
          aria-label="Open maps app in new tab"
        >
          Open in New Tab 🔗
        </a>
      </div>
      
      <div className="iframe-wrapper">
        <iframe
          src={TEAMMATE_MAPS_URL}
          title="Teammate's Maps Application"
          className="maps-iframe"
          allowFullScreen
          onError={handleIframeError}
          aria-label="Embedded maps application from teammate"
          // Security attributes
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          // Allow specific permissions if needed
          allow="geolocation; fullscreen"
        />
        
        {/* Fallback content for browsers that don't support iframes */}
        <noscript>
          <div className="iframe-fallback">
            <p>Your browser doesn't support iframes or JavaScript is disabled.</p>
            <a 
              href={TEAMMATE_MAPS_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Open Maps App Directly
            </a>
          </div>
        </noscript>
      </div>
      
      {/* Loading indicator - could be enhanced with actual loading state */}
      <div className="loading-overlay" id="maps-loading">
        <div className="loading-spinner"></div>
        <p>Loading teammate's maps application...</p>
      </div>
    </div>
  );
};

export default MapsFrame;