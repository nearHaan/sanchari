"use client";

import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
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
      </MapContainer>
    </div>
  );
};

export default MapView;
