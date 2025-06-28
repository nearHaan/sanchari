'use client';

import TopBar from './components/TopBar';
import SideBarHome from './components/SideBarHome';
import MapWrapper from './components/MapWrapper';
import PopupLogin from './components/PopupLogin';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [showLogIn, setShowLogIn] = useState(false);
  const [geojson, setGeojson] = useState(null);

  const handlePopup = () => {
    setShowLogIn(!showLogIn);
  };

  const handleLogin = () => {
    router.push('/edit_map');
  };

  const onGeoJsonSearch = (district, taluk, village) => {
    if (!district || !taluk || !village) return;
    fetch(`/api/village_geojson?district=${district}&sub_dist=${taluk}&name=${village}`)
      .then(res => {
        if (!res.ok) throw new Error("GeoJSON fetch failed");
        return res.json();
      })
      .then(data => {
        setGeojson(data);
      })
      .catch(err => console.error('Error loading GeoJSON:', err));
  };

  return (
    <main>
      <div className="flex flex-col h-screen w-screen bg-white">
        <TopBar />
        <div className="relative flex h-screen">
          <SideBarHome onEditMapClick={handlePopup} onLocationSearch={onGeoJsonSearch} />
          <div className="absolute z-0 inset-0 flex-1 bg-blue-100">
            <MapWrapper geojson={geojson} />
          </div>
        </div>
        {showLogIn && <PopupLogin onClose={handlePopup} onLogin={handleLogin} />}
      </div>
    </main>
  );
}
