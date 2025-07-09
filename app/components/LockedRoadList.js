'use client';

import { useMapTool } from "../context/MapToolContext";
import LockedRoadTile from "./LockedRoadTile";

export default function LockedRoadList() {
  const { lockedRoads, beforeSaveRef, unlockRoad } = useMapTool();

  return (
    <tbody>
      {Object.entries(lockedRoads).map(([roadid, username]) => {
        const isChanged = beforeSaveRef.current.has(roadid);
        return (
          <LockedRoadTile
            key={roadid}
            roadid={roadid}
            state={isChanged ? "c" : "nc"}
            onClick={() => unlockRoad(roadid)}
          />
        );
      })}
    </tbody>
  );
}
