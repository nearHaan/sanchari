'use client';

const { createContext, useState, useContext, useRef } = require("react");
import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const MapToolContext = createContext();

export function MapToolProvider({ children }) {
    const [tool, setTool] = useState('move');
    const saveEditRef = useRef(null);
    const cancelEditRef = useRef(null);
    const checkValidSave = useRef(null);
    const logClickRef = useRef(null);
    const hideLogRef = useRef(null);
    const [lockedRoads, setLockedRoads] = useState({});
    const beforeSaveRef = useRef(new Map());
    
    // Move these states to context for centralized management
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    const [selectedRoadId, setSelectedRoadId] = useState(null);
    const [showRoadInfo, setShowRoadInfo] = useState(false);
    const [roadInfo, setRoadInfo] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const lockRoad = (roadid, username) => {
        socket.emit("road-lock", { roadid, username });
        setLockedRoads(prev => ({ ...prev, [roadid]: username }));
    };

    const unlockRoad = (roadid) => {
        socket.emit("road-unlock", { roadid });
        setLockedRoads(prev => {
            const copy = { ...prev };
            delete copy[roadid];
            return copy;
        });
        beforeSaveRef.current.delete(roadid);
        
        // Clear selection if this road was selected
        if (selectedFeatureId === roadid) {
            setSelectedFeatureId(null);
            setSelectedRoadId(null);
            setShowRoadInfo(false);
            setRoadInfo(null);
        }
    };

    const unlockAllMyRoads = () => {
        if (!currentUser) return;
        
        const myRoads = Object.keys(lockedRoads).filter(roadid => lockedRoads[roadid] === currentUser);
        myRoads.forEach(roadid => unlockRoad(roadid));
    };

    // Helper function to check if current user owns a road
    const isMyRoad = (roadid) => lockedRoads[roadid] === currentUser;

    return (
        <MapToolContext.Provider value={{
            tool, setTool, saveEditRef, checkValidSave, cancelEditRef, hideLogRef, logClickRef, 
            lockedRoads, setLockedRoads, beforeSaveRef,
            selectedFeatureId, setSelectedFeatureId,
            selectedRoadId, setSelectedRoadId,
            showRoadInfo, setShowRoadInfo,
            roadInfo, setRoadInfo,
            currentUser, setCurrentUser,
            lockRoad, unlockRoad, unlockAllMyRoads, isMyRoad,
            socket
        }}>
            {children}
        </MapToolContext.Provider>
    );
}

export function useMapTool() {
    return useContext(MapToolContext);
}