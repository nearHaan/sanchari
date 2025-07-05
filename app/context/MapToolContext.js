'use client';

const { createContext, useState, useContext, useRef } = require("react");

const MapToolContext = createContext();

export function MapToolProvider({children}){
    const [tool, setTool] = useState('move');
    const cancelEditRef = useRef(null);

    return(
        <MapToolContext.Provider value={{ tool, setTool, cancelEditRef}}>
            {children}
        </MapToolContext.Provider>
    );
}

export function useMapTool() {
    return useContext(MapToolContext);
}