

import React from "react";
import { MapContainer, TileLayer, LayersControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as EL from "esri-leaflet";
import "./MapView.css";

const { BaseLayer, Overlay } = LayersControl;

// Custom ArcGIS Feature Layer component
const ArcGISFeatureLayer = ({ url, style, popupField }) => {
  const map = useMap();

  React.useEffect(() => {
    const layer = EL.featureLayer({ url, style }).addTo(map);

    if (popupField) {
      layer.bindPopup((featureLayer) => featureLayer.feature.properties[popupField]);
    }

    return () => layer.remove();
  }, [map, url, style, popupField]);

  return null;
};

const MapView = () => {
  return (
    <MapContainer
      center={[22.9734, 78.6569]} // center of India
      zoom={5}
      style={{ height: "100vh", width: "100%" }}
    >
      <LayersControl position="topright">
        {/* Base Layers */}
        <BaseLayer checked name="Esri World Topo Map">
          <TileLayer
            attribution="Tiles © Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          />
        </BaseLayer>

        <BaseLayer name="Esri Satellite">
          <TileLayer
            attribution="Tiles © Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </BaseLayer>

        {/* Overlays */}
        <Overlay checked name="IFR / CR">
          <ArcGISFeatureLayer
            url="https://services.arcgis.com/PLACEHOLDER_IFR_CR_URL/FeatureServer/0"
            style={() => ({
              color: "#1b5e20",
              weight: 1,
              fillOpacity: 0.3,
            })}
            popupField="name"
          />
        </Overlay>

        <Overlay checked name="Village Boundaries">
          <ArcGISFeatureLayer
            url="https://services.arcgis.com/PLACEHOLDER_VILLAGES_URL/FeatureServer/0"
            style={() => ({
              color: "#4caf50",
              weight: 1,
              fillOpacity: 0.1,
            })}
            popupField="village_name"
          />
        </Overlay>

        <Overlay checked name="Land Use">
          <ArcGISFeatureLayer
            url="https://services.arcgis.com/PLACEHOLDER_LANDUSE_URL/FeatureServer/0"
            style={() => ({
              color: "#81c784",
              weight: 1,
              fillOpacity: 0.2,
            })}
            popupField="category"
          />
        </Overlay>

        <Overlay checked name="Assets">
          <ArcGISFeatureLayer
            url="https://services.arcgis.com/PLACEHOLDER_ASSETS_URL/FeatureServer/0"
            style={() => ({
              color: "#558b2f",
              weight: 1,
              fillOpacity: 0.3,
            })}
            popupField="asset_name"
          />
        </Overlay>
      </LayersControl>
    </MapContainer>
  );
};

export default MapView;



