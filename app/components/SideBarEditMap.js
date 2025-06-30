'use client'

import { useState } from "react";
import { ExitIcon, LogIcon, MapIcon, SettingsIcon } from "./Icons";
import EditMapTab from "./EditMapTab";
import LogCard from "./LogCard";
import { useRouter } from "next/navigation";

export default function SideBarEditMap() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("map");

    async function onTabClick(tab) {
        if (tab == "exit") {
            await fetch('/api/logout', { method: 'POST' });
            router.back();
        }
        setActiveTab(tab);
    }

    const log = [
        {
            id: 1,
            timestamp: "28-06-2025 12:00",
            name: "Admin1",
            desc: "Test Text"
        },
        {
            id: 2,
            timestamp: "28-06-2025 12:00",
            name: "Admin1",
            desc: "Test Text"
        },
        {
            id: 3,
            timestamp: "28-06-2025 12:00",
            name: "Admin1",
            desc: "Test Text"
        },
        {
            id: 4,
            timestamp: "28-06-2025 12:00",
            name: "Admin1",
            desc: "Test Text"
        },
    ];

    return (
        <div className="flex absolute z-30 top-0 bottom-0 left-0 w-90 bg-white rounded-r-2xl">
            <div className="flex flex-col bg-[#F0F2F5] w-auto">
                <button onClick={() => { onTabClick("map") }} className={`m-2 p-2 hover:bg-white rounded-2xl ${activeTab == "map" ? "bg-white" : ""}`}>
                    < MapIcon />
                </button>
                <button onClick={() => { onTabClick("log") }} className={`m-2 p-2 hover:bg-white rounded-2xl ${activeTab == "log" ? "bg-white" : ""}`}>
                    < LogIcon
                        times
                    />
                </button>
                <button onClick={() => { onTabClick("settings") }} className={`m-2 p-2 hover:bg-white rounded-2xl ${activeTab == "settings" ? "bg-white" : ""}`}>
                    < SettingsIcon />
                </button>
                <button onClick={() => { onTabClick("exit") }} className={`m-2 p-2 hover:bg-white rounded-2xl ${activeTab == "exit" ? "bg-white" : ""}`}>
                    < ExitIcon />
                </button>
            </div>
            {(activeTab == "map") && <EditMapTab />}
            {(activeTab == "log") && (
                <div className="flex-1">
                    {log.map((logItem) => {
                        return (
                            <LogCard
                                key={logItem.id}
                                timestamp={logItem.timestamp}
                                name={logItem.name}
                                desc={logItem.desc}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}