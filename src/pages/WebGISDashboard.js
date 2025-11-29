import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WebGISDashboard.css';

const WebGISDashboard = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surveyInput, setSurveyInput] = useState('123');
  const [selectedDistrict, setSelectedDistrict] = useState('Warangal');
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [layerVisibility, setLayerVisibility] = useState({
    allDistricts: true,
    selectedDistrict: true,
    mandal: true,
    survey: true,
    villages: false
  });
  const [layerCounts, setLayerCounts] = useState({
    allDistricts: 0,
    selectedDistrict: 0,
    mandal: 0,
    survey: 0,
    villages: 0
  });

  // Data storage
  const layers = useRef({
    allDistricts: null,
    selectedDistrict: null,
    mandal: null,
    survey: null,
    villages: null
  });
  const highlightedSurvey = useRef(null);
  const mapInitialized = useRef(false);
  const scriptLoaded = useRef(false);

  // Telangana center coordinates
  const TELANGANA_CENTER = { lat: 17.5, lng: 79.0 };

  // Load Google Maps script
  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      // Check if already fully loaded
      if (window.google && window.google.maps && window.google.maps.Map) {
        console.log('Google Maps already fully loaded');
        scriptLoaded.current = true;
        resolve(window.google);
        return;
      }

      // Check if script already exists in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps script exists, waiting for full load...');
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            clearInterval(checkInterval);
            scriptLoaded.current = true;
            console.log('Google Maps fully loaded');
            resolve(window.google);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!scriptLoaded.current) {
            reject(new Error('Google Maps loading timeout'));
          }
        }, 10000);
        return;
      }

      console.log('Loading Google Maps script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBgAKob7FryELT0X-Hb0zHcTdGpc5teS6w`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            clearInterval(checkInterval);
            scriptLoaded.current = true;
            console.log('Google Maps script loaded and initialized successfully');
            resolve(window.google);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          if (scriptLoaded.current) {
            resolve(window.google);
          } else {
            reject(new Error('Google Maps failed to initialize'));
          }
        }, 5000);
      };
      
      script.onerror = (error) => {
        console.error('Error loading Google Maps script:', error);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  };

  const convertCoordinatesToLatLng = (coordinates) => {
    return coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
  };

  const fitToBounds = (coordinates, mapInstance) => {
    if (!mapInstance || !window.google || !window.google.maps) {
      console.error('Map instance or Google Maps not available');
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach(coord => {
      bounds.extend(new window.google.maps.LatLng(coord[1], coord[0]));
    });
    mapInstance.fitBounds(bounds);
  };

  const showInfoWindow = (position, type, properties, mapInstance) => {
    if (!mapInstance || !window.google || !window.google.maps) {
      console.error('Map instance or Google Maps not available');
      return;
    }

    let content = `<div style="padding: 10px;"><h4 style="margin: 0 0 10px 0;">${type} Information</h4>`;
    
    Object.keys(properties).forEach(key => {
      if (properties[key] !== null && properties[key] !== undefined) {
        content += `<p style="margin: 5px 0;"><strong>${key}:</strong> ${properties[key]}</p>`;
      }
    });
    
    content += '</div>';

    const infoWindow = new window.google.maps.InfoWindow({
      position: position,
      content: content
    });
    infoWindow.open(mapInstance);
  };

  const loadAllDistrictsLayer = async (mapInstance) => {
    if (!mapInstance || !window.google || !window.google.maps) {
      console.error('Map instance not ready for loading districts');
      return;
    }

    try {
      const response = await fetch('./districts.geojson');
      const data = await response.json();
      
      const districtNames = data.features
        .map(feature => feature.properties.DISTRICT_N)
        .filter(name => name)
        .sort();
      setAvailableDistricts(districtNames);
      
      setLayerCounts(prev => ({ ...prev, allDistricts: data.features.length }));
      
      if (layers.current.allDistricts) {
        layers.current.allDistricts.forEach(item => item.polygon.setMap(null));
      }
      
      layers.current.allDistricts = data.features.map(feature => {
        const polygon = new window.google.maps.Polygon({
          paths: convertCoordinatesToLatLng(feature.geometry.coordinates[0]),
          strokeColor: '#cccccc',
          strokeOpacity: 0.5,
          strokeWeight: 1,
          fillColor: '#f0f0f0',
          fillOpacity: 0.1,
          map: layerVisibility.allDistricts ? mapInstance : null
        });
        
        polygon.addListener('click', function(event) {
          showInfoWindow(event.latLng, 'District', feature.properties, mapInstance);
          if (feature.properties.DISTRICT_N) {
            setSelectedDistrict(feature.properties.DISTRICT_N);
          }
        });
        
        return { polygon, feature };
      });
      
      console.log('All districts layer loaded successfully');
    } catch (error) {
      console.error('Error loading all districts layer:', error);
    }
  };

  const loadSelectedDistrictLayer = async (mapInstance) => {
    if (!mapInstance || !window.google || !window.google.maps) {
      console.error('Map instance not ready for loading selected district');
      return;
    }

    try {
      const response = await fetch('./districts.geojson');
      const data = await response.json();
      
      const selectedDistrictFeatures = data.features.filter(feature => 
        feature.properties.DISTRICT_N && 
        feature.properties.DISTRICT_N === selectedDistrict
      );
      
      if (selectedDistrictFeatures.length === 0) {
        console.warn(`No district found with name: ${selectedDistrict}`);
        return;
      }
      
      setLayerCounts(prev => ({ ...prev, selectedDistrict: selectedDistrictFeatures.length }));
      
      if (layers.current.selectedDistrict) {
        layers.current.selectedDistrict.forEach(item => item.polygon.setMap(null));
      }
      
      layers.current.selectedDistrict = selectedDistrictFeatures.map(feature => {
        const polygon = new window.google.maps.Polygon({
          paths: convertCoordinatesToLatLng(feature.geometry.coordinates[0]),
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          fillColor: '#FF0000',
          fillOpacity: 0.1,
          map: layerVisibility.selectedDistrict ? mapInstance : null
        });
        
        polygon.addListener('click', function(event) {
          showInfoWindow(event.latLng, 'Selected District', feature.properties, mapInstance);
        });
        
        return { polygon, feature };
      });
      
      if (selectedDistrictFeatures.length > 0) {
        fitToBounds(selectedDistrictFeatures[0].geometry.coordinates[0], mapInstance);
      }
      
      console.log('Selected district layer loaded successfully');
    } catch (error) {
      console.error('Error loading selected district layer:', error);
    }
  };

  const loadMandalLayer = async (mapInstance) => {
    if (!mapInstance || !window.google || !window.google.maps) {
      console.error('Map instance not ready for loading mandals');
      return;
    }

    try {
      const response = await fetch('./mandals.geojson');
      const data = await response.json();
      
      const selectedDistrictMandals = data.features.filter(feature => {
        const district = feature.properties.District || '';
        return district === selectedDistrict;
      });
      
      if (selectedDistrictMandals.length === 0) {
        selectedDistrictMandals.push(...data.features.slice(0, 10));
      }
      
      setLayerCounts(prev => ({ ...prev, mandal: selectedDistrictMandals.length }));
      
      if (layers.current.mandal) {
        layers.current.mandal.forEach(item => item.polygon.setMap(null));
      }
      
      layers.current.mandal = selectedDistrictMandals.map(feature => {
        const polygon = new window.google.maps.Polygon({
          paths: convertCoordinatesToLatLng(feature.geometry.coordinates[0]),
          strokeColor: '#0066CC',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#0066CC',
          fillOpacity: 0.1,
          map: layerVisibility.mandal ? mapInstance : null
        });
        
        polygon.addListener('click', function(event) {
          showInfoWindow(event.latLng, 'Mandal', feature.properties, mapInstance);
        });
        
        return { polygon, feature };
      });
      
      console.log('Mandal layer loaded successfully');
    } catch (error) {
      console.error('Error loading mandal layer:', error);
    }
  };

  const loadSurveyLayer = async (mapInstance) => {
    if (!mapInstance || !window.google || !window.google.maps) {
      console.error('Map instance not ready for loading surveys');
      return;
    }

    try {
      const response = await fetch('./surveys.geojson');
      const data = await response.json();
      
      setLayerCounts(prev => ({ ...prev, survey: data.features.length }));
      
      if (layers.current.survey) {
        layers.current.survey.forEach(item => item.polygon.setMap(null));
      }
      
      layers.current.survey = data.features.map(feature => {
        const polygon = new window.google.maps.Polygon({
          paths: convertCoordinatesToLatLng(feature.geometry.coordinates[0]),
          strokeColor: '#666666',
          strokeOpacity: 0.6,
          strokeWeight: 1,
          fillColor: '#999999',
          fillOpacity: 0.2,
          map: layerVisibility.survey ? mapInstance : null
        });
        
        polygon.addListener('click', function(event) {
          showInfoWindow(event.latLng, 'Survey', feature.properties, mapInstance);
        });
        
        return { polygon, feature };
      });
      
      console.log('Survey layer loaded successfully');
    } catch (error) {
      console.error('Error loading survey layer:', error);
    }
  };

  const loadLayers = async (mapInstance) => {
    if (!mapInstance || !window.google || !window.google.maps) {
      console.error('Cannot load layers - map instance not ready');
      return;
    }

    try {
      console.log('Loading all layers...');
      await loadAllDistrictsLayer(mapInstance);
      await loadSelectedDistrictLayer(mapInstance);
      await loadMandalLayer(mapInstance);
      await loadSurveyLayer(mapInstance);
      
      setLoading(false);
      console.log('All layers loaded successfully');
    } catch (error) {
      console.error('Error loading layers:', error);
      setLoading(false);
    }
  };

  const highlightSurvey = (surveyNo = null, mapInstance = null) => {
    const input = surveyNo || surveyInput;
    const mapToUse = mapInstance || map;
    
    if (!input) {
      alert('Please enter a survey number');
      return;
    }
    
    if (!mapToUse) {
      alert('Map not loaded yet');
      return;
    }
    
    clearHighlight();
    
    const surveyLayer = layers.current.survey;
    if (!surveyLayer) {
      alert('Survey layer not loaded yet');
      return;
    }
    
    const found = surveyLayer.find(item => 
      item.feature.properties.SURVEY_NO === input
    );
    
    if (found) {
      highlightedSurvey.current = found.polygon;
      found.polygon.setOptions({
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        fillColor: '#FF0000',
        fillOpacity: 0.3
      });
      
      const bounds = new window.google.maps.LatLngBounds();
      found.feature.geometry.coordinates[0].forEach(coord => {
        bounds.extend(new window.google.maps.LatLng(coord[1], coord[0]));
      });
      mapToUse.fitBounds(bounds);
      
      setTimeout(() => {
        mapToUse.setZoom(Math.min(mapToUse.getZoom(), 16));
      }, 100);
      
      const center = bounds.getCenter();
      showInfoWindow(center, 'Highlighted Survey', found.feature.properties, mapToUse);
      
      console.log(`Survey ${input} highlighted successfully`);
    } else {
      alert(`Survey ${input} not found`);
    }
  };

  const clearHighlight = () => {
    if (highlightedSurvey.current) {
      highlightedSurvey.current.setOptions({
        strokeColor: '#666666',
        strokeOpacity: 0.6,
        strokeWeight: 1,
        fillColor: '#999999',
        fillOpacity: 0.2
      });
      highlightedSurvey.current = null;
    }
  };

  const toggleLayer = (layerType) => {
    const newVisibility = { ...layerVisibility, [layerType]: !layerVisibility[layerType] };
    setLayerVisibility(newVisibility);
    
    const layer = layers.current[layerType];
    if (layer && map) {
      layer.forEach(item => {
        item.polygon.setMap(newVisibility[layerType] ? map : null);
      });
    }
  };

  useEffect(() => {
    if (mapInitialized.current) {
      console.log('Map already initialized, skipping...');
      return;
    }

    const initMap = async () => {
      try {
        console.log('Starting map initialization...');
        
        await loadGoogleMapsScript();
        
        console.log('Google Maps script loaded, verifying...');
        
        if (!window.google || !window.google.maps || !window.google.maps.Map) {
          throw new Error('Google Maps not fully loaded');
        }
        
        if (!mapRef.current) {
          throw new Error('Map container reference is null');
        }

        console.log('Creating map instance...');
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: 8,
          center: TELANGANA_CENTER,
          mapTypeId: 'terrain',
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
            }
          ]
        });
        
        console.log('Map instance created successfully');
        mapInitialized.current = true;
        setMap(mapInstance);
        
        console.log('Starting to load layers...');
        await loadLayers(mapInstance);
        
      } catch (error) {
        console.error('Error initializing map:', error);
        setLoading(false);
        alert('Failed to load map. Please refresh the page.');
      }
    };

    initMap();
    
    return () => {
      console.log('Cleaning up map...');
    };
  }, []);

  useEffect(() => {
    if (map && selectedDistrict && mapInitialized.current) {
      console.log('District changed to:', selectedDistrict);
      loadSelectedDistrictLayer(map);
      loadMandalLayer(map);
    }
  }, [selectedDistrict]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      highlightSurvey();
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          backgroundColor: '#1f2937',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#374151'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#1f2937'}
      >
        <span>←</span> Back to Home
      </button>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>
              Loading Telangana GIS Map...
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Please wait while we load the map layers
            </p>
          </div>
        </div>
      )}

      {/* Controls panel */}
      <div style={{
        position: 'absolute',
        top: '70px',
        left: '16px',
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        color: '#000000',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        minWidth: '250px'
      }}>
        <h4 style={{ 
          fontWeight: 'bold', 
          marginBottom: '12px', 
          fontSize: '16px',
          color: '#333'
        }}>
          Survey Highlighter
        </h4>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={surveyInput}
            onChange={(e) => setSurveyInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter Survey No."
            style={{
              flex: '1',
              minWidth: '120px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => highlightSurvey()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            Highlight
          </button>
          <button
            onClick={clearHighlight}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Info panel */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        minWidth: '240px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h4 style={{ 
          fontWeight: 'bold', 
          marginBottom: '16px', 
          fontSize: '16px',
          color: '#333'
        }}>
          Telangana GIS Dashboard
        </h4>
        
        {/* District Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '600', 
            marginBottom: '6px',
            color: '#555'
          }}>
            Select District:
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#000000'
            }}
          >
            {availableDistricts.map(district => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ 
          marginBottom: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h5 style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#000000'
          }}>
            Layer Controls:
          </h5>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px', 
            cursor: 'pointer',
            padding: '4px',
            color: '#000000'
          }}>
            <input
              type="checkbox"
              checked={layerVisibility.allDistricts}
              onChange={() => toggleLayer('allDistricts')}
              style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', color: '#000000' }}>
              All Districts <span style={{ color: '#000000' }}>(Gray)</span>
            </span>
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px', 
            cursor: 'pointer',
            padding: '4px'
          }}>
            <input
              type="checkbox"
              checked={layerVisibility.selectedDistrict}
              onChange={() => toggleLayer('selectedDistrict')}
              style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: '#000000' }}>
              Selected District <span style={{ color: '#FF0000' }}>(Red)</span>
            </span>
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px', 
            cursor: 'pointer',
            padding: '4px'
          }}>
            <input
              type="checkbox"
              checked={layerVisibility.mandal}
              onChange={() => toggleLayer('mandal')}
              style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: '#000000' }}>
              Mandals <span style={{ color: '#0066CC' }}>(Blue)</span>
            </span>
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '4px'
          }}>
            <input
              type="checkbox"
              checked={layerVisibility.survey}
              onChange={() => toggleLayer('survey')}
              style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: '#000000' }}>
              Surveys <span style={{ color: '#666' }}>(Gray)</span>
            </span>
          </label>
        </div>

        <div style={{ fontSize: '13px', color: '#000000', backgroundColor: 'white' }}>
          <h5 style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#000000'
          }}>
            Layer Statistics:
          </h5>
          <p style={{ margin: '4px 0', color: '#000000' }}>
            <strong style={{ color: '#000000' }}>All Districts:</strong> {layerCounts.allDistricts}
          </p>
          <p style={{ margin: '4px 0', color: '#000000' }}>
            <strong style={{ color: '#000000' }}>Selected:</strong> {selectedDistrict}
          </p>
          <p style={{ margin: '4px 0', color: '#000000' }}>
            <strong style={{ color: '#000000' }}>Mandals:</strong> {layerCounts.mandal}
          </p>
          <p style={{ margin: '4px 0', color: '#000000' }}>
            <strong style={{ color: '#000000' }}>Surveys:</strong> {layerCounts.survey}
          </p>
        </div>
      </div>

      {/* Map container */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }} 
      />

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WebGISDashboard;