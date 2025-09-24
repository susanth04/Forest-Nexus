

import React from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Rectangle,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const { BaseLayer, Overlay } = LayersControl;

const villageIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [25, 25],
});

const warangalBounds = [
  [17.5, 79.2],
  [18.5, 80.0],
];

const MapView = ({ data }) => (
  <MapContainer
    center={[17.9784, 79.5941]}
    zoom={9}
    style={{ height: "400px", width: "100%", borderRadius: "12px" }}
  >
    <LayersControl position="topright">
      <BaseLayer checked name="OpenStreetMap">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </BaseLayer>
      <BaseLayer name="Satellite (Esri)">
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
      </BaseLayer>
      <Overlay checked name="Bounding Box">
        <Rectangle
          bounds={warangalBounds}
          pathOptions={{ color: "#a3d9a5", weight: 2, fillOpacity: 0 }}
        />
      </Overlay>
    </LayersControl>

    {data.map((row, i) =>
      row.latitude && row.longitude ? (
        <Marker key={i} position={[row.latitude, row.longitude]} icon={villageIcon}>
          <Popup>
            <div style={{ color: "#1b4332" }}>
              <strong>{row.village_name}</strong>
              <br />
              🌳 Forest: {row.forest_ha} ha
              <br />
              🌾 Cropland: {row.cropland_ha} ha
              <br />
              💧 Water: {row.water_ha} ha
            </div>
          </Popup>
        </Marker>
      ) : null
    )}
  </MapContainer>
);

export default MapView;
