'use client'

import TopBar from "../components/TopBar";
import SideBarEditMap from "../components/SideBarEditMap";
import MapWrapper from "../components/MapWrapper";
import { useEffect, useState } from "react";

export default function EditMapPage() {
    const [geojson, setGeojson] = useState(null);

    useEffect(() => {
        const fetchGeojson = async () => {
            try {
                const res = await fetch('/api/geojson/village-with-roads?district=Kollam&sub_dist=Kottarakkara&name=Melila');
                const data = await res.json();
                setGeojson(data);
            } catch (err) {
                console.error('Failed to fetch GeoJSON:', err);
            }
        };

        fetchGeojson();
    }, []);
    return (
        <main>
            <div className="flex flex-col h-screen w-screen bg-white">
                <TopBar />
                <div className="relative flex h-screen">
                    <SideBarEditMap />
                    <div className="absolute z-0 inset-0 flex-1 bg-blue-100">
                        <MapWrapper geojson={geojson} />
                    </div>
                </div>
            </div>
        </main>
    );
}