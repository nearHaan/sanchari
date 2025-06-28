'use client'

import TopBar from './components/TopBar';
import SideBarHome from './components/SideBarHome';
import MapWrapper from './components/Map/MapWrapper';
import PopupLogin from './components/PopupLogin';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [showLogIn, setShowLogIn] = useState(false);

  const handlePopup = () => {
    setShowLogIn(!showLogIn);
  }

  const handleLogin = () => {
    router.push('/edit_map');
  }

  return (
    <main>
      <div className="flex flex-col h-screen w-screen bg-white">
        <TopBar />
        <div className="relative flex h-screen">
            <SideBarHome onEditMapClick={handlePopup}/>
            <div className="absolute z-0 inset-0 flex-1 bg-blue-100">
                < MapWrapper/>
            </div>
        </div>
        {showLogIn && (
          < PopupLogin onClose={handlePopup} onLogin={handleLogin}/>
        )}
      </div>
    </main>
  );
}
