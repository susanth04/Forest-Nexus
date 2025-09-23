import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

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

export default function MapView() {
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

  // Load all GeoJSON data
  useEffect(() => {
    // Load claims data
    fetch("/demo_claims.geojson")
      .then(res => res.json())
      .then(data => setGeoData(data.features))
      .catch(err => console.error("Error loading claims:", err));

    // Load village boundaries
    fetch("/village_boundaries.geojson")
      .then(res => res.json())
      .then(data => setVillageData(data.features))
      .catch(err => console.error("Error loading villages:", err));

    // Load assets
    fetch("/forest_assets.geojson")
      .then(res => res.json())
      .then(data => setAssetData(data.features))
      .catch(err => console.error("Error loading assets:", err));
  }, []);

  // Get unique values for filters
  const states = [...new Set(geoData.map(f => f.properties.state))];
  const districts = filterState === "All" ? 
    [...new Set(geoData.map(f => f.properties.district))] :
    [...new Set(geoData.filter(f => f.properties.state === filterState).map(f => f.properties.district))];
  const villages = filterDistrict === "All" ?
    [...new Set(geoData.map(f => f.properties.village))] :
    [...new Set(geoData.filter(f => f.properties.district === filterDistrict).map(f => f.properties.village))];

  // Filter claims
  const filteredClaims = geoData.filter(feat => {
    const props = feat.properties;
    const matchSearch =
      props.name.toLowerCase().includes(searchText.toLowerCase()) ||
      props.patta_no.toLowerCase().includes(searchText.toLowerCase()) ||
      (props.village || "").toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = filterStatus === "All" || props.status === filterStatus;
    const matchState = filterState === "All" || props.state === filterState;
    const matchDistrict = filterDistrict === "All" || props.district === filterDistrict;
    const matchVillage = filterVillage === "All" || props.village === filterVillage;
    return matchSearch && matchStatus && matchState && matchDistrict && matchVillage;
  });

  const handlePanelClick = idx => {
    setSelected(idx);
    setTimeout(() => {
      if (markerRefs.current[idx]) {
        markerRefs.current[idx].openPopup();
      }
    }, 200);
  };

  const handleExport = () => {
    exportToCsv("fra_claims.csv", filteredClaims.map(f => ({
      Name: f.properties.name,
      "Patta Number": f.properties.patta_no,
      Area: f.properties.area_ha,
      Status: f.properties.status,
      Village: f.properties.village,
      District: f.properties.district,
      State: f.properties.state
    })));
  };

  const defaultCenter = geoData[0]?.geometry.coordinates.slice().reverse() || [21.1466, 79.0888];

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">FRA Atlas - Interactive Map</h1>
          <p className="page-subtitle">
            Explore Forest Rights Act claims, village boundaries, and forest assets
          </p>
        </div>
      </div>

      <div className="mapview-wrapper">
        {/* Map Controls */}
        <div className="map-controls-overlay">
          <div className="control-group">
            <h4>Layer Controls</h4>
            <label>
              <input 
                type="checkbox" 
                checked={showVillages} 
                onChange={(e) => setShowVillages(e.target.checked)}
              />
              Village Boundaries
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={showAssets} 
                onChange={(e) => setShowAssets(e.target.checked)}
              />
              Forest Assets
            </label>
          </div>
        </div>

        {/* Left Map */}
        <div className="mapview-map">
          <MapContainer center={defaultCenter} zoom={10} style={{ height: "100vh", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Village Boundaries */}
            {showVillages && villageData.map((village, idx) => (
              <GeoJSON
                key={`village-${idx}`}
                data={village}
                style={{
                  fillColor: "#e0f2fe",
                  weight: 2,
                  opacity: 0.8,
                  color: "#0891b2",
                  fillOpacity: 0.3
                }}
              >
                <Popup>
                  <div>
                    <h4>{village.properties.name}</h4>
                    <p>District: {village.properties.district}</p>
                    <p>Population: {village.properties.population}</p>
                  </div>
                </Popup>
              </GeoJSON>
            ))}

            {/* Claims Markers */}
            {filteredClaims.map((feat, idx) => {
              const coords = [feat.geometry.coordinates[1], feat.geometry.coordinates[0]];
              return (
                <CircleMarker
                  key={idx}
                  center={coords}
                  pathOptions={{ 
                    color: statusColor(feat.properties.status),
                    fillColor: claimTypeColor(feat.properties.claim_type)
                  }}
                  radius={8}
                  fillOpacity={0.8}
                  ref={ref => (markerRefs.current[idx] = ref)}
                  eventHandlers={{
                    click: () => handlePanelClick(idx)
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 220 }}>
                      <div style={{ fontWeight: "bold", fontSize: "1.1em", marginBottom: "8px" }}>
                        {feat.properties.name}
                      </div>
                      <div><strong>Claim Type:</strong> {feat.properties.claim_type || "N/A"}</div>
                      <div><strong>Patta No:</strong> {feat.properties.patta_no}</div>
                      <div><strong>Area (Ha):</strong> {feat.properties.area_ha}</div>
                      <div><strong>Village:</strong> {feat.properties.village}</div>
                      <div><strong>District:</strong> {feat.properties.district}</div>
                      <div><strong>State:</strong> {feat.properties.state}</div>
                      <div style={{ marginTop: "8px" }}>
                        Status:{" "}
                        <span
                          className="badge"
                          style={{
                            background: statusColor(feat.properties.status),
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "8px"
                          }}
                        >
                          {feat.properties.status}
                        </span>
                      </div>
                      <div className="dss-suggestion" style={{ 
                        fontSize: 12, 
                        color: "#64748b", 
                        marginTop: 8,
                        background: "#f8fafc",
                        padding: "4px 8px",
                        borderRadius: "4px"
                      }}>
                        <strong>DSS:</strong> {dssSuggestion(feat)}
                      </div>
                    </div>
                  </Popup>
                  {selected === idx && (
                    <ZoomToMarker position={coords} openPopup={() => markerRefs.current[idx]} />
                  )}
                </CircleMarker>
              );
            })}

            {/* Forest Assets */}
            {showAssets && assetData.map((asset, idx) => {
              const coords = [asset.geometry.coordinates[1], asset.geometry.coordinates[0]];
              const assetColor = asset.properties.type === "pond" ? "#06b6d4" : "#059669";
              return (
                <CircleMarker
                  key={`asset-${idx}`}
                  center={coords}
                  pathOptions={{ color: assetColor }}
                  radius={6}
                  fillOpacity={0.7}
                >
                  <Popup>
                    <div>
                      <h4>{asset.properties.name}</h4>
                      <p>Type: {asset.properties.type}</p>
                      <p>Area: {asset.properties.area_ha} ha</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Right Panel */}
        <div className="mapview-panel">
          <div className="panel-search">
            <input
              type="text"
              placeholder="Search by name, patta, village..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="search-box"
            />
            
            <select
              value={filterState}
              onChange={e => {
                setFilterState(e.target.value);
                setFilterDistrict("All");
                setFilterVillage("All");
              }}
              className="dropdown-filter"
            >
              <option value="All">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            <select
              value={filterDistrict}
              onChange={e => {
                setFilterDistrict(e.target.value);
                setFilterVillage("All");
              }}
              className="dropdown-filter"
            >
              <option value="All">All Districts</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>

            <select
              value={filterVillage}
              onChange={e => setFilterVillage(e.target.value)}
              className="dropdown-filter"
            >
              <option value="All">All Villages</option>
              {villages.map(village => (
                <option key={village} value={village}>{village}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="dropdown-filter"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Granted">Granted</option>
            </select>
          </div>

          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{filteredClaims.length}</span>
              <span className="stat-label">Total Claims</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredClaims.filter(f => f.properties.status === "Granted").length}</span>
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredClaims.filter(f => f.properties.status === "Pending").length}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>

          <div className="panel-list">
            {filteredClaims.map((feat, idx) => (
              <div
                key={idx}
                className="claim-card"
                onClick={() => handlePanelClick(idx)}
                style={{
                  boxShadow: selected === idx ? "0 0 0 2px #3b82f6" : "0 1px 8px 0 rgba(70,70,90,0.06)",
                  borderRadius: "8px",
                  background: "#fff",
                  marginBottom: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s"
                }}
              >
                <div style={{ fontSize: "1.05em", fontWeight: 600, marginBottom: "8px" }}>
                  {feat.properties.name}
                </div>
                <div className="card-row">
                  <span className="muted-text">Patta: {feat.properties.patta_no}</span>
                  <span className="muted-text">Area: {feat.properties.area_ha} ha</span>
                </div>
                <div className="card-row">
                  <span className="muted-text">{feat.properties.village}</span>
                  <span className="muted-text">{feat.properties.district}</span>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <span
                    className="badge"
                    style={{
                      background: statusColor(feat.properties.status),
                      color: "white",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "12px",
                      marginRight: "8px"
                    }}
                  >
                    {feat.properties.status}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: claimTypeColor(feat.properties.claim_type),
                      color: "white",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "12px"
                    }}
                  >
                    {feat.properties.claim_type || "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button className="panel-export" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}