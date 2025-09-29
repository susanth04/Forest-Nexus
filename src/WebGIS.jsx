import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./WebGIS.css";

// Utility: Export to CSV
function exportToCsv(filename, rows) {
  const processRow = row => Object.values(row).map(val => `"${val}"`).join(",");
  const csvContent = ["Name,Patta Number,Area,Status,Village,District,State"].concat(
    rows.map(processRow)
  ).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Helper component to zoom and open popup
function ZoomToMarker({ position, openPopup }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 16);
  }, [position, map]);
  useEffect(() => {
    if (openPopup && openPopup()) openPopup().openPopup();
  }, [openPopup]);
  return null;
}

const statusColor = status =>
  status === "Granted" ? "#10b981" : status === "Pending" ? "#f59e0b" : "#64748b";
  
const dssSuggestion = (feature) => [
  feature.properties.area_ha < 2 ? "Recommend: PM-KISAN" : "",
  feature.properties.status === "Pending" ? "Priority: Verification" : "",
].filter(Boolean).join(" | ");

const claimTypeColor = type => {
  switch(type) {
    case "IFR": return "#3b82f6";
    case "CFR": return "#10b981"; 
    case "CR": return "#f59e0b";
    default: return "#64748b";
  }
};

const WARANGAL_CENTER = { lat: 18.0046, lng: 79.5847 }; // Default center coordinates for Warangal

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

const WebGIS = () => {
  const [mapState, dispatch] = React.useReducer(
    (state, action) => {
      switch (action.type) {
        case 'UPDATE_COORDINATES':
          return { ...state, coordinates: action.payload };
        case 'UPDATE_LAYER':
          return { ...state, selectedLayer: action.payload };
        case 'UPDATE_CSV':
          return { ...state, csvData: action.payload };
        case 'UPDATE_GEOJSON':
          return { ...state, geoJsonData: action.payload };
        default:
          return state;
      }
    },
    {
      coordinates: WARANGAL_CENTER,
      selectedLayer: null,
      csvData: [],
      geoJsonData: null
    }
  );
  const [geoData, setGeoData] = useState([]);
  const [villageData, setVillageData] = useState([]);
  const [assetData, setAssetData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterState, setFilterState] = useState("All");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterVillage, setFilterVillage] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAssets, setShowAssets] = useState(true);
  const [showVillages, setShowVillages] = useState(true);
  const markerRefs = useRef([]);

  // Load Google Maps script
  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBgAKob7FryELT0X-Hb0zHcTdGpc5teS6w&callback=initGoogleMap`;
      script.async = true;
      script.defer = true;
      
      // Create a global callback
      window.initGoogleMap = () => {
        resolve(window.google);
      };
      
      script.onerror = reject;
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
    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach(coord => {
      bounds.extend({ lat: coord[1], lng: coord[0] });
    });
    mapInstance.fitBounds(bounds);
  };

  const showInfoWindow = (position, type, properties, mapInstance) => {
    let content = `<div style="max-width: 300px;"><h4>${type} Information</h4>`;
    
    Object.keys(properties).forEach(key => {
      if (properties[key] !== null && properties[key] !== undefined) {
        content += `<p><strong>${key}:</strong> ${properties[key]}</p>`;
      }
    });
    
    content += '</div>';

    const infoWindow = new window.google.maps.InfoWindow({
      position: position,
      content: content
    });
    infoWindow.open(mapInstance);
  };

  const loadDistrictLayer = async (mapInstance) => {
    try {
      const response = await fetch('./districts.geojson');
      const data = await response.json();
      
      const warangalDistricts = data.features.filter(feature => 
        feature.properties.DISTRICT_N && 
        feature.properties.DISTRICT_N.toLowerCase().includes('warangal')
      );
      
      if (warangalDistricts.length === 0) {
        warangalDistricts.push(data.features[0]);
      }
      
      setLayerCounts(prev => ({ ...prev, districts: warangalDistricts.length }));
      
      layers.current.districts = warangalDistricts.map(feature => {
        const polygon = new window.google.maps.Polygon({
          paths: convertCoordinatesToLatLng(feature.geometry.coordinates[0]),
          strokeColor: '#000000',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          fillColor: 'transparent',
          fillOpacity: 0,
          map: layerVisibility.districts ? mapInstance : null
        });
        
        polygon.addListener('click', function(event) {
          showInfoWindow(event.latLng, 'District', feature.properties, mapInstance);
        });
        
        return { polygon, feature };
      });
      
      if (layers.current.districts.length > 0) {
        fitToBounds(layers.current.districts[0].feature.geometry.coordinates[0], mapInstance);
      }
      
    } catch (error) {
      console.error('Error loading district layer:', error);
    }
  };

  const loadMandalLayer = async (mapInstance) => {
    try {
      const response = await fetch('./mandals.geojson');
      const data = await response.json();
      
      const warangalMandals = data.features.filter(feature => {
        const district = feature.properties.District || feature.properties.DISTRICT || '';
        return district.toLowerCase().includes('warangal') || 
               (feature.properties.Mandal && feature.properties.Mandal.toLowerCase().includes('warangal'));
      });
      
      if (warangalMandals.length === 0) {
        warangalMandals.push(...data.features.slice(0, 10));
      }
      
      setLayerCounts(prev => ({ ...prev, mandals: warangalMandals.length }));
      
      layers.current.mandals = warangalMandals.map(feature => {
        const polygon = new window.google.maps.Polygon({
          paths: convertCoordinatesToLatLng(feature.geometry.coordinates[0]),
          strokeColor: '#0066CC',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#0066CC',
          fillOpacity: 0.1,
          map: layerVisibility.mandals ? mapInstance : null
        });
        
        polygon.addListener('click', function(event) {
          showInfoWindow(event.latLng, 'Mandal', feature.properties, mapInstance);
        });
        
        return { polygon, feature };
      });
      
    } catch (error) {
      console.error('Error loading mandal layer:', error);
    }
  };

  const loadSurveyLayer = async (mapInstance) => {
    try {
      const response = await fetch('./surveys.geojson');
      const data = await response.json();
      
      setLayerCounts(prev => ({ ...prev, surveys: data.features.length }));
      
      layers.current.surveys = data.features.map(feature => {
        const polygon = new window.google.maps.Polygon({
          paths: convertCoordinatesToLatLng(feature.geometry.coordinates[0]),
          strokeColor: '#666666',
          strokeOpacity: 0.6,
          strokeWeight: 1,
          fillColor: '#999999',
          fillOpacity: 0.2,
          map: layerVisibility.surveys ? mapInstance : null
        });
        
        polygon.addListener('click', function(event) {
          showInfoWindow(event.latLng, 'Survey', feature.properties, mapInstance);
        });
        
        return { polygon, feature };
      });
      
    } catch (error) {
      console.error('Error loading survey layer:', error);
    }
  };

  const loadLayers = async (mapInstance) => {
    try {
      await loadDistrictLayer(mapInstance);
      await loadMandalLayer(mapInstance);
      await loadSurveyLayer(mapInstance);
      
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading layers:', error);
      setLoading(false);
    }
  };

  const toggleLayer = (layerType) => {
    const newVisibility = { ...layerVisibility, [layerType]: !layerVisibility[layerType] };
    setLayerVisibility(newVisibility);
    
    const layer = layers.current[layerType];
    if (layer) {
      layer.forEach(item => {
        item.polygon.setMap(newVisibility[layerType] ? map : null);
      });
    }
  };

  const highlightSurvey = (surveyNo) => {
    const input = surveyNo || surveyInput;
    
    if (!input) {
      alert('Please enter a survey number');
      return;
    }
    
    clearHighlight();
    
    const surveyLayer = layers.current.surveys;
    if (!surveyLayer) {
      alert('Survey layer not loaded yet');
      return;
    }
    
    const found = surveyLayer.find(item => 
      item.feature.properties.SURVEY_NO === input
    );
    
    if (found) {
      highlightedFeature.current = found.polygon;
      found.polygon.setOptions({
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        fillColor: '#FF0000',
        fillOpacity: 0.3
      });
      
      const bounds = new window.google.maps.LatLngBounds();
      found.feature.geometry.coordinates[0].forEach(coord => {
        bounds.extend({ lat: coord[1], lng: coord[0] });
      });
      map.fitBounds(bounds);
      map.setZoom(Math.min(map.getZoom(), 16));
      
      const center = bounds.getCenter();
      showInfoWindow(center, 'Highlighted Survey', found.feature.properties, map);
      
      console.log(`Survey ${input} highlighted successfully`);
    } else {
      alert(`Survey ${input} not found`);
    }
  };

  const clearHighlight = () => {
    if (highlightedFeature.current) {
      highlightedFeature.current.setOptions({
        strokeColor: '#666666',
        strokeOpacity: 0.6,
        strokeWeight: 1,
        fillColor: '#999999',
        fillOpacity: 0.2
      });
      highlightedFeature.current = null;
    }
  };

  const changeMapType = (mapType) => {
    if (map) {
      map.setMapTypeId(mapType);
    }
  };
    try {
      console.log('Rendering map...');
      if (!mapRef.current) {
        console.log('Map ref not available');
        return;
      }
      
      // Clear previous content
      mapRef.current.innerHTML = '';
      
      const containerRect = mapRef.current.getBoundingClientRect();
      const width = containerRect.width || 800;
      const height = 500;
      
      // Create a simple interactive map visualization
      const svg = d3.select(mapRef.current)
        .append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .style('background', 'linear-gradient(180deg, #1a365d 0%, #2d3748 100%)')
        .style('border-radius', '10px');
      
      // Add map elements
      const mapGroup = svg.append('g');
      
      // Add coordinate grid
      const gridGroup = mapGroup.append('g').attr('class', 'grid');
      const gridCols = Math.floor(width / 60);
      const gridRows = Math.floor(height / 50);
      
      for (let i = 0; i <= gridCols; i++) {
        gridGroup.append('line')
          .attr('x1', i * 60)
          .attr('y1', 0)
          .attr('x2', i * 60)
          .attr('y2', height)
          .attr('stroke', 'rgba(255,255,255,0.1)')
          .attr('stroke-width', 1);
      }
      
      for (let i = 0; i <= gridRows; i++) {
        gridGroup.append('line')
          .attr('x1', 0)
          .attr('y1', i * 50)
          .attr('x2', width)
          .attr('y2', i * 50)
          .attr('stroke', 'rgba(255,255,255,0.1)')
          .attr('stroke-width', 1);
      }
      
      // Add village boundaries if selected layer is villages and data is available
      if (selectedLayer === 'villages' && geoJsonData && geoJsonData.features) {
        // Simple representation of village boundaries
        const villageGroup = mapGroup.append('g').attr('class', 'village-boundaries');
        
        geoJsonData.features.slice(0, 10).forEach((feature, i) => {
          // Create simplified boundary representations
          const x = 50 + (i % 5) * 120;
          const y = 50 + Math.floor(i / 5) * 120;
          const size = 80;
          
          // Add boundary polygon (simplified rectangle)
          villageGroup.append('rect')
            .attr('x', x)
            .attr('y', y)
            .attr('width', size)
            .attr('height', size)
            .attr('fill', 'none')
            .attr('stroke', '#39ff88')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .style('opacity', 0.7);
          
          // Add village label
          const villageName = feature.properties?.DISTRICT_N || feature.properties?.village_name || `Village ${i+1}`;
          villageGroup.append('text')
            .attr('x', x + size/2)
            .attr('y', y + size/2)
            .attr('text-anchor', 'middle')
            .attr('fill', '#39ff88')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .text(villageName.length > 10 ? villageName.substring(0, 10) + '...' : villageName);
        });
      }
      
      // Add center marker
      mapGroup.append('circle')
        .attr('cx', width/2)
        .attr('cy', height/2)
        .attr('r', 8)
        .attr('fill', '#39ff88')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
      
      // Add location label
      mapGroup.append('text')
        .attr('x', width/2)
        .attr('y', height/2 - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#39ff88')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text('Telangana Region');
      
      // Add layer-specific visualizations
      if (selectedLayer === 'forest') {
        // Add forest coverage visualization
        for (let i = 0; i < 8; i++) {
          mapGroup.append('circle')
            .attr('cx', 100 + Math.random() * (width - 200))
            .attr('cy', 100 + Math.random() * (height - 200))
            .attr('r', 15 + Math.random() * 20)
            .attr('fill', '#2d5016')
            .attr('opacity', 0.6)
            .on('mouseover', function() {
              d3.select(this).attr('opacity', 0.9);
            })
            .on('mouseout', function() {
              d3.select(this).attr('opacity', 0.6);
            });
        }
      }
      
      // Add data points if CSV data is available
      if (csvData.length > 0) {
        const dataPoints = csvData.slice(0, 20); // Show first 20 points
        
        mapGroup.selectAll('.data-point')
          .data(dataPoints)
          .enter()
          .append('circle')
          .attr('class', 'data-point')
          .attr('cx', (d, i) => 100 + (i % 10) * (width - 200) / 10)
          .attr('cy', (d, i) => 100 + Math.floor(i / 10) * (height - 200) / 2)
          .attr('r', 4)
          .attr('fill', '#ffd700')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            d3.select(this).attr('r', 6);
            
            // Show data tooltip
            const tooltip = d3.select('body').append('div')
              .attr('class', 'map-tooltip')
              .style('opacity', 0)
              .style('position', 'absolute')
              .style('background', 'rgba(0,0,0,0.8)')
              .style('color', '#fff')
              .style('padding', '8px')
              .style('border-radius', '4px')
              .style('font-size', '12px')
              .style('pointer-events', 'none');
            
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(Object.keys(d).slice(0, 3).map(key => `${key}: ${d[key]}`).join('<br>'))
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', function(event, d) {
            d3.select(this).attr('r', 4);
            d3.selectAll('.map-tooltip').remove();
          });
      }
      
      // Add legend
      const legend = mapGroup.append('g').attr('class', 'legend');
      const legendItems = [
        { color: '#39ff88', label: 'Center Point' },
        { color: '#ffd700', label: 'Data Points' },
        { color: '#2d5016', label: 'Forest Areas' }
      ];
      
      if (selectedLayer === 'villages' && geoJsonData) {
        legendItems.push({ color: '#39ff88', label: 'Village Boundaries', stroke: true });
      }
      
      legendItems.forEach((item, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(20, ${20 + i * 20})`);
        
        if (item.stroke) {
          legendItem.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', 'none')
            .attr('stroke', item.color)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '3,3');
        } else {
          legendItem.append('circle')
            .attr('cx', 7.5)
            .attr('cy', 7.5)
            .attr('r', 5)
            .attr('fill', item.color);
        }
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 12)
          .attr('fill', '#f5f5f5')
          .attr('font-size', '11px')
          .text(item.label);
      });
    } catch (error) {
      console.error('Error rendering map:', error);
      if (setError) setError(error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapState]);

  // Initialize map when component mounts
  useEffect(() => {
    try {
      console.log('Initializing map...');
      // Delay map rendering to ensure DOM is ready
      const timer = setTimeout(() => {
        if (mapRef.current && !mapInstance.current) {
          const { lat, lng } = coordinates || WARANGAL_CENTER;
          const mockGoogleMap = {
            center: { lat, lng },
            zoom: 10,
            markers: [],
            overlays: []
          };
          mapInstance.current = mockGoogleMap;
          renderMap();
        }
      }, 500); // Increased delay
      
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError(err);
    }
  }, [renderMap]);

  // Load GeoJSON data
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        // Load actual GeoJSON files from public directory
        const responses = await Promise.allSettled([
          fetch('/districts.geojson'),
          fetch('/mandals.geojson'),
          fetch('/surveys.geojson')
        ]);
        
        const geoJsonFiles = [];
        for (let i = 0; i < responses.length; i++) {
          const response = responses[i];
          if (response.status === 'fulfilled' && response.value.ok) {
            const data = await response.value.json();
            geoJsonFiles.push(data);
          }
        }
        
        if (geoJsonFiles.length > 0) {
          // Combine all GeoJSON features
          const combinedGeoJSON = {
            type: "FeatureCollection",
            features: geoJsonFiles.reduce((acc, file) => {
              if (file.features) {
                return acc.concat(file.features);
              }
              return acc;
            }, [])
          };
          setGeoJsonData(combinedGeoJSON);
          console.log('Loaded GeoJSON data:', combinedGeoJSON.features.length, 'features');
        } else {
          // Fallback to mock data if files can't be loaded
          const mockGeoJSON = {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { "DISTRICT_N": "Warangal", "STATE": "Telangana" },
                geometry: {
                  type: "Polygon",
                  coordinates: [[
                    [78.0, 17.0], [79.0, 17.0], [79.0, 18.0], [78.0, 18.0], [78.0, 17.0]
                  ]]
                }
              }
            ]
          };
          setGeoJsonData(mockGeoJSON);
        }
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
        // Fallback to mock data
        const mockGeoJSON = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { "DISTRICT_N": "Warangal", "STATE": "Telangana" },
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [78.0, 17.0], [79.0, 17.0], [79.0, 18.0], [78.0, 18.0], [78.0, 17.0]
                ]]
              }
            }
          ]
        };
        setGeoJsonData(mockGeoJSON);
      }
    };
    loadGeoJSON();
  }, []);

  // CSV file upload handler
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          setCsvData(result.data);
          analyzeData(result.data);
        },
        header: true,
        skipEmptyLines: true
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  // Analyze CSV data
  const analyzeData = (data) => {
    if (!data || data.length === 0) return;
    
    const numericColumns = [];
    const sampleRow = data[0];
    
    Object.keys(sampleRow).forEach(key => {
      const values = data.map(row => parseFloat(row[key])).filter(val => !isNaN(val));
      if (values.length > 0) {
        numericColumns.push({
          column: key,
          mean: d3.mean(values),
          median: d3.median(values),
          min: d3.min(values),
          max: d3.max(values),
          count: values.length
        });
      }
    });
    
    setAnalytics({
      totalRows: data.length,
      columns: Object.keys(sampleRow).length,
      numericColumns,
      summary: `Analyzed ${data.length} rows with ${Object.keys(sampleRow).length} columns`
    });
  };

  console.log('WebGIS about to render, error:', error);
  
  // Error boundary - must be after all hooks
  if (error) {
    return (
      <div className="webgis-container">
        <div className="webgis-content">
          <div className="error-message">
            <h2>Something went wrong:</h2>
            <p>{error.message}</p>
            <button onClick={() => setError(null)}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="webgis-container">
      <div className="webgis-content">
        <div className="webgis-header">
          <h1 className="webgis-title">🌍 WebGIS Platform</h1>
          <p className="webgis-subtitle">Interactive Forest Mapping & Spatial Analysis with Google Maps</p>
          <p style={{color: '#39ff88', fontSize: '12px'}}>Debug: Component loaded successfully</p>
        </div>

        <div className="webgis-grid">
          {/* Map Controls Card */}
          <div className="gis-card controls-card">
            <h2 className="card-title">Map Controls</h2>
            
            <div className="search-section">
              <input
                type="text"
                className="map-search"
                placeholder="Search location, coordinates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-btn">🔍</button>
            </div>

            <div className="layers-section">
              <h3>Map Layers</h3>
              <div className="layers-grid">
                {mapLayers.map(layer => (
                  <button
                    key={layer.id}
                    className={`layer-btn ${selectedLayer === layer.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedLayer(layer.id);
                      if (layer.id === 'villages' && geoJsonData) {
                        // Toggle village boundaries overlay
                        renderMap();
                      }
                    }}
                  >
                    <span className="layer-icon">{layer.icon}</span>
                    <span className="layer-name">{layer.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CSV Upload Section */}
            <div className="upload-section">
              <h3>Data Upload</h3>
              <div {...getRootProps()} className={`csv-dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="dropzone-content">
                  <span className="upload-icon">📊</span>
                  {isDragActive ? (
                    <p>Drop the CSV file here...</p>
                  ) : (
                    <p>Drag & drop a CSV file here, or click to select</p>
                  )}
                </div>
              </div>
              {csvData.length > 0 && (
                <div className="upload-success">
                  <span className="success-icon">✅</span>
                  <span>Uploaded {csvData.length} records</span>
                </div>
              )}
            </div>

            <div className="tools-section">
              <h3>Analysis Tools</h3>
              <div className="tools-grid">
                <button className="tool-btn" onClick={() => setShowVisualization(!showVisualization)}>
                  📈 Visualizations
                </button>
                <button className="tool-btn">📏 Distance</button>
                <button className="tool-btn">📐 Area</button>
                <button className="tool-btn">📍 Mark Point</button>
              </div>
            </div>

            <div className="coordinates-display">
              <h3>Current Coordinates</h3>
              <div className="coord-values">
                <span>Lat: {coordinates.lat.toFixed(4)}°</span>
                <span>Lng: {coordinates.lng.toFixed(4)}°</span>
              </div>
            </div>
          </div>

          {/* Map Display Card */}
          <div className="gis-card map-card">
            <div className="map-header">
              <h2 className="card-title">Interactive Forest Map</h2>
              <div className="map-actions">
                <button className="map-action-btn" onClick={renderMap}>🔄 Refresh</button>
                <button className="map-action-btn">⤴ Export</button>
                <button className="map-action-btn">🖨 Print</button>
              </div>
            </div>
            
            <div className="map-container">
              <div ref={mapRef} className="interactive-map">
                {/* Google Maps or D3 visualization will be rendered here */}
              </div>
            </div>

            <div className="map-controls-bar">
              <button className="zoom-btn" onClick={() => renderMap()}>➕ Zoom In</button>
              <button className="zoom-btn">➖ Zoom Out</button>
              <button className="zoom-btn">🏠 Reset View</button>
              <button className="zoom-btn">📡 My Location</button>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="gis-card analytics-card">
            <h2 className="card-title">Data Analytics Dashboard</h2>
            <div className="analytics-summary">
              <div className="summary-card">
                <span className="summary-value">{analytics.totalRows}</span>
                <span className="summary-label">Total Records</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">{analytics.columns}</span>
                <span className="summary-label">Columns</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">{analytics.numericColumns.length}</span>
                <span className="summary-label">Numeric Fields</span>
              </div>
            </div>
            
            {analytics.numericColumns.length > 0 && (
              <div className="numeric-analysis">
                <h3>Numeric Column Analysis</h3>
                <div className="analysis-grid">
                  {analytics.numericColumns.slice(0, 3).map((col, index) => (
                    <div key={index} className="analysis-item">
                      <h4>{col.column}</h4>
                      <div className="stat-row">
                        <span>Mean: {col.mean?.toFixed(2)}</span>
                        <span>Range: {col.min?.toFixed(2)} - {col.max?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visualization Panel */}
        {showVisualization && csvData.length > 0 && (
          <div className="gis-card visualization-card">
            <h2 className="card-title">Data Visualizations</h2>
            <div className="viz-container">
              <div className="viz-placeholder">
                <p>📊 Interactive charts and graphs will be displayed here</p>
                <p>Based on your uploaded CSV data with {csvData.length} records</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results Card */}
        <div className="gis-card analysis-card">
          <h2 className="card-title">Forest Analysis Results</h2>
          <div className="analysis-grid">
            <div className="analysis-item">
              <h3>Forest Density Analysis</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '78%'}}></div>
              </div>
              <span className="analysis-value">78% Dense Forest Coverage</span>
            </div>
            <div className="analysis-item">
              <h3>Land Use Classification</h3>
              <div className="classification-tags">
                <span className="tag forest">Forest: 65%</span>
                <span className="tag agriculture">Agriculture: 20%</span>
                <span className="tag settlement">Settlement: 10%</span>
                <span className="tag water">Water: 5%</span>
              </div>
            </div>
            <div className="analysis-item">
              <h3>Village Boundary Analysis</h3>
              <p className="change-alert">📍 {geoJsonData?.features?.length || 0} village boundaries loaded</p>
              <button className="view-changes-btn" onClick={() => setSelectedLayer('villages')}>
                View Village Boundaries
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WrappedWebGIS = () => (
  <ErrorBoundary>
    <WebGIS />
  </ErrorBoundary>
);

export default WrappedWebGIS;
