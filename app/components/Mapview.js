"use client";

import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";

const MapUpdater = ({ userPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (userPosition) {
      map.flyTo(userPosition, 13);
    }
  }, [userPosition]);

  return null;
};

const GeoJSONViewer = ({ geojson }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
  if (!geojson) return;

  if (layerRef.current) {
    map.removeLayer(layerRef.current);
  }

  const layer = L.geoJSON(geojson, {
    style: {
      weight: 2,
      opacity: 1,
      fillOpacity: 0,
    },
  });

  layer.addTo(map);
  const bounds = layer.getBounds();
  if (bounds.isValid()) {
    map.flyToBounds(bounds, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }

  layerRef.current = layer;
}, [geojson, map]);

  return null;
};

export default function MapView({ userPosition, geojson }) {
  const defaultPosition = [10.8505, 76.2711];
  const mapRef = useRef(null);

  return (
    <div className="flex-1">
      <MapContainer
        center={defaultPosition}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        />

        <MapUpdater userPosition={userPosition} />

        {userPosition && (
          <Marker position={userPosition}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {geojson && <GeoJSONViewer geojson={geojson} />}
      </MapContainer>
    </div>
  );
}
