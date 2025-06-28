'use client'

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./Mapview"), {
  ssr: false,
  loading: () => <div className="text-center p-4">Loading map...</div>
});

const MapWrapper = () => {
  return (
    <div className="flex h-full">
      <MapView />
    </div>
  );
};

export default MapWrapper;
