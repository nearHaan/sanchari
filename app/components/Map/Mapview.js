"use client";

import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  GeoJSON,
  CircleMarker
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

const MapUpdater = ({ userPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (userPosition) {
      map.flyTo(userPosition, 13);
    }
  }, [userPosition]);

  return null;
};

const MapView = ({ userPosition }) => {
  const defaultPosition = [10.8505, 76.2711];
  const [geoData, setGeoData] = useState(null);
  const [activeNodes, setActiveNodes] = useState([]);

  useEffect(() => {
    fetch("/Road_Merged.geojson")
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
      });
  }, []);

  // Function to run for each feature (road)
  const onEachRoad = (feature, layer) => {
    layer.on("click", () => {
      const geometry = feature.geometry;

      if (geometry.type === "MultiLineString") {
        const points = geometry.coordinates.flat(); // [[lng, lat], [lng, lat], ...]
        const latlngs = points.map(([lng, lat]) => [lat, lng]);
        setActiveNodes(latlngs); 
      } else if (geometry.type === "LineString") {
        const latlngs = geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setActiveNodes(latlngs);
      }
    });
  };

  return (
  <div className="flex-1">
    <MapContainer
      center={defaultPosition}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
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

      {geoData && (
        <GeoJSON data={geoData} onEachFeature={onEachRoad} />
      )}

      {activeNodes.map((position, idx) => (
        <CircleMarker
          key={idx}
          center={position}
          radius={4}
          pathOptions={{ color: "red", fillColor: "red", fillOpacity: 1 }}
        >
          <Popup>Node {idx + 1}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  </div>
);
}
export default MapView;
