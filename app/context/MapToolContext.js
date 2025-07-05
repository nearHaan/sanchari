'use client';

const { createContext, useState, useContext } = require("react");

const MapToolContext = createContext();

export function MapToolProvider({children}){
    const [tool, setTool] = useState('move');

    return(
        <MapToolContext.Provider value={{ tool, setTool}}>
            {children}
        </MapToolContext.Provider>
    );
}

export function useMapTool() {
    return useContext(MapToolContext);
}