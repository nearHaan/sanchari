'use client'

import TopBar from "../components/TopBar";
import SideBarEditMap from "../components/SideBarEditMap";
import { useEffect, useState } from "react";
import { AvatarIcon } from "../components/Icons";
import { useSearchParams } from "next/navigation";
import MapEditorWrapper from "../components/Map/MapEditorWrapper";

export default function EditMapPageClient({ username }) {
    const searchParams = useSearchParams();
    const district = searchParams.get('district');
    const sub_dist = searchParams.get('sub_dist');
    const village = searchParams.get('village');
    const [roadGeojson, setRoadGeojson] = useState(null);
    const [villageFeature, setVillageFeature] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(
                `/api/geojson/village-with-roads?district=${district}&sub_dist=${sub_dist}&name=${village}`
            );
            const data = await res.json();
            setRoadGeojson(data.roads);
            setVillageFeature(data.village);
        };

        fetchData();
    }, []);

    return (
        <main>
            <div className="flex flex-col h-screen w-screen bg-white">
                <TopBar />
                <div className="relative flex h-screen">
                    <SideBarEditMap />
                    <div className="relative z-0 inset-0 flex-1 bg-blue-100">
                        <div className="absolute z-20 top-2 right-2 flex items-center pl-1 pr-2 py-1 bg-white rounded-full text-black min-w-[150] shadow-md">
                            <div className="mr-1 bg-[#E5E8EB] rounded-full size-7 flex items-center justify-center"><AvatarIcon /></div>
                            <label className="text-black">{username ?? "Guest"}</label>
                        </div>
                        <div className="absolute inset-0 z-10">
                            <MapEditorWrapper username={username} villageFeature={villageFeature}
                                roadGeojson={roadGeojson}
                                setRoadGeojson={setRoadGeojson} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
