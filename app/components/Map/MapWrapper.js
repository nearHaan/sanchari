'use client'

import { MapView,UserLocation } from "./MapLoader";
import { useState } from "react";

const MapWrapper = () => {
  const[userPosition, setUserPosition] = useState(null);

  return (
    <div className="flex h-screen">
      <UserLocation setUserPosition={setUserPosition} />
      <MapView userPosition={userPosition} />
    </div>
  );
};

export default MapWrapper;