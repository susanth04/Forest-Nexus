import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

// Utility: Export to CSV
function exportToCsv(filename, rows) {
  const processRow = row => Object.values(row).map(val => `"${val}"`).join(",");
  const csvContent = ["Name,Patta Number,Area,Status"].concat(
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
    if (position) map.setView(position, 16); // Zoom level
  }, [position]);
  useEffect(() => {
    if (openPopup && openPopup()) openPopup().openPopup();
  }, [openPopup]);
  return null;
}

const statusColor = status =>
  status === "Granted" ? "green" : status === "Pending" ? "orange" : "gray";
const dssSuggestion = (feature) => [
  feature.properties.area_ha < 2 ? "Recommend: PM-KISAN" : "",
  feature.properties.status === "Pending" ? "Priority: Verification" : "",
].filter(Boolean).join(" | ");

const filters = [
  { value: "All", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Granted", label: "Granted" }
];

export default function MapView() {
  const [geoData, setGeoData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState(null);
  const markerRefs = useRef([]);

  // Load GeoJSON from public folder
  useEffect(() => {
    fetch("/demo_claims.geojson")
      .then(res => res.json())
      .then(data => setGeoData(data.features));
  }, []);

  // Filter claims for listing/panel/search/dropdown
  const filteredClaims = geoData.filter(feat => {
    const props = feat.properties;
    const matchSearch =
      props.name.toLowerCase().includes(searchText.toLowerCase()) ||
      props.patta_no.toLowerCase().includes(searchText.toLowerCase()) ||
      (props.village || "").toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = filterStatus === "All" || props.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Handler to zoom to marker and open popup
  const handlePanelClick = idx => {
    setSelected(idx);
    setTimeout(() => {
      if (markerRefs.current[idx]) {
        markerRefs.current[idx].openPopup();
      }
    }, 200);
  };

  // CSV export
  const handleExport = () => {
    exportToCsv("claims.csv", filteredClaims.map(f => ({
      Name: f.properties.name,
      "Patta Number": f.properties.patta_no,
      Area: f.properties.area_ha,
      Status: f.properties.status
    })));
  };

  // Default center: first claim or a fallback
  const defaultCenter = geoData[0]?.geometry.coordinates.reverse() || [21.1466, 79.0888];

  return (
    <div className="mapview-wrapper">
      {/* Left Map */}
      <div className="mapview-map">
        <MapContainer center={defaultCenter} zoom={13} style={{ height: "100vh", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredClaims.map((feat, idx) => {
            const coords = [feat.geometry.coordinates[1], feat.geometry.coordinates[0]]; // [lat, lng]
            return (
              <CircleMarker
                key={idx}
                center={coords}
                pathOptions={{ color: statusColor(feat.properties.status) }}
                radius={12}
                fillOpacity={0.7}
                ref={ref => (markerRefs.current[idx] = ref)}
                eventHandlers={{
                  click: () => handlePanelClick(idx)
                }}
              >
                <Popup>
                  <div style={{ minWidth: 210 }}>
                    <div style={{ fontWeight: "bold" }}>{feat.properties.name}</div>
                    <div>Patta No.: {feat.properties.patta_no}</div>
                    <div>Area (Ha): {feat.properties.area_ha}</div>
                    <div>
                      Status:{" "}
                      <span
                        className={`badge badge-${feat.properties.status.toLowerCase()}`}
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
                    <div className="dss-suggestion" style={{ fontSize: 13, color: "#828282", marginTop: 8 }}>
                      DSS: {dssSuggestion(feat)}
                    </div>
                  </div>
                </Popup>
                {selected === idx && (
                  <ZoomToMarker position={coords} openPopup={() => markerRefs.current[idx]} />
                )}
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
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="dropdown-filter"
          >
            {filters.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="panel-list">
          {filteredClaims.map((feat, idx) => (
            <div
              key={idx}
              className="claim-card"
              onClick={() => handlePanelClick(idx)}
              style={{
                boxShadow: selected === idx ? "0 0 0 2px #4287f5" : "0 1px 8px 0 rgba(70,70,90,0.06)",
                borderRadius: "12px",
                background: "#fff",
                marginBottom: "18px",
                padding: "16px",
                cursor: "pointer",
                transition: "box-shadow 0.2s"
              }}
            >
              <div style={{ fontSize: "1.07em", fontWeight: 600 }}>{feat.properties.name}</div>
              <div className="card-row">
                <span className="muted-text">Patta: {feat.properties.patta_no}</span>
                <span className="muted-text" style={{marginLeft:8}}>Area: {feat.properties.area_ha} ha</span>
              </div>
              <div>
                <span
                  className={`badge badge-${feat.properties.status.toLowerCase()}`}
                  style={{
                    background: statusColor(feat.properties.status),
                    color: "white",
                    borderRadius: "8px",
                    padding: "2px 8px",
                    fontSize: "12px",
                    marginTop: "6px"
                  }}
                >
                  {feat.properties.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          className="panel-export"
          onClick={handleExport}
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}