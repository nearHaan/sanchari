'use client';

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useMapTool } from "@/app/context/MapToolContext";

const createNodeIcon = (tool) => {
  const div = document.createElement('div');
  div.className =
    'w-3 h-3 rounded-full border-2 border-white bg-blue-600 shadow-md transition-transform duration-150 hover:scale-125';

  if (tool === 'delete-node') {
    div.className += ' hover:bg-red-600';
  }

  return L.divIcon({
    className: '',
    html: div.outerHTML,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const GeoJSONEditor = ({
  user,
  villageFeature,
  globalLockedRoads,
  roadGeojson,
  setRoadGeojson,
}) => {
  const map = useMap();
  const layerRef = useRef(null);
  const roadLayersRef = useRef(new Map());
  const updatedGeojson = useRef(new Map());
  const nodeMap = useRef(new Map());

  // Single global undo/redo stacks
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const { 
    tool, setTool, saveEditRef, checkValidSave, cancelEditRef, logClickRef, hideLogRef, 
    lockedRoads, setLockedRoads, beforeSaveRef, lockRoad, unlockRoad, unlockAllMyRoads, isMyRoad,
    selectedFeatureId, setSelectedFeatureId, selectedRoadId, setSelectedRoadId, 
    showRoadInfo, setShowRoadInfo, roadInfo, setRoadInfo, currentUser, setCurrentUser, applyFeatureChangeRef,
    socket 
  } = useMapTool();
  
  const [historicalFeature, setHistoricalFeature] = useState(null);
  const [addAfterNodeIndex, setAddAfterNodeIndex] = useState(null);
  const [nodes, setNodes] = useState([]);
  const hasZoomed = useRef(false);

  // Set current user
  useEffect(() => {
    if (user && !currentUser) {
      setCurrentUser(user);
    }
  }, [user, currentUser, setCurrentUser]);

  // Helper function to create an action object for the undo/redo stack
  const createAction = (type, roadId, beforeState, afterState) => ({
    type,
    roadId,
    beforeState: JSON.parse(JSON.stringify(beforeState)),
    afterState: JSON.parse(JSON.stringify(afterState)),
    timestamp: Date.now()
  });

  // Helper function to push action to undo stack and clear redo stack
  const pushToUndoStack = (action) => {
    undoStack.current.push(action);
    redoStack.current.length = 0; // Clear redo stack when new action is performed

    // Optional: Limit stack size to prevent memory issues
    if (undoStack.current.length > 100) {
      undoStack.current.shift();
    }
  };

  useEffect(() => {
    if (!tool || !map) {
      setTool('move');
    }

    if (tool === 'move') {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }

    if (tool === 'zoom-in') {
      map.zoomIn();
      setTool('');
    }

    if (tool === 'zoom-out') {
      map.zoomOut();
      setTool('');
    }

    if (tool === 'undo') {
      undo();
      setTool('');
    }

    if (tool === 'redo') {
      redo();
      setTool('');
    }
  }, [tool, map]);

  useEffect(() => {
    if (tool !== 'add-node' || addAfterNodeIndex === null) return;

    const handleClick = (e) => {
      const { lat, lng } = e.latlng;
      const newIndex = insertNodeAt(addAfterNodeIndex, { lat, lng });
      setAddAfterNodeIndex(newIndex);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [tool, addAfterNodeIndex, map]);

  useEffect(() => {
    saveEditRef.current = onSaveChange;
    checkValidSave.current = () => updatedGeojson.current.size > 0;
    cancelEditRef.current = () => {
      beforeSaveRef.current.forEach(f => applyFeatureChange(f));
      updatedGeojson.current.clear();
    };
    logClickRef.current = logClick;
    hideLogRef.current = hideLog;
    applyFeatureChangeRef.current = applyFeatureChange;
  }, [roadGeojson]);

  useEffect(() => {
    const esc = (e) => {
      if (e.key === 'Escape' && selectedFeatureId) {
        unlockAllMyRoads();
      }
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [selectedFeatureId, unlockAllMyRoads]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [roadGeojson, selectedFeatureId]);

  // Update nodes when selectedFeatureId changes
  useEffect(() => {
    if (!selectedFeatureId || !roadGeojson) {
      setNodes([]);
      return;
    }

    const selectedFeature = roadGeojson.features.find(
      (f) => f.properties.roadid === selectedFeatureId
    );

    if (!selectedFeature) {
      setNodes([]);
      return;
    }

    const newNodes = [];
    let nodeIndex = 0;

    selectedFeature.geometry.coordinates.forEach((line, lineIndex) => {
      line.forEach(([lng, lat], pointIndex) => {
        newNodes.push({
          index: nodeIndex++,
          lat,
          lng,
          lineIndex,
          pointIndex,
        });
      });
    });

    setNodes(newNodes);
  }, [selectedFeatureId, roadGeojson]);

  const insertNodeAt = (nodeIndex, latlng) => {
    const selectedFeature = roadGeojson?.features?.find(
      (f) => f.properties.roadid === selectedFeatureId
    );
    if (!selectedFeature) return;

    const node = nodes.find((n) => n.index === nodeIndex);
    if (!node) return;

    const prevFeature = JSON.parse(JSON.stringify(selectedFeature));

    if (!beforeSaveRef.current.has(selectedFeatureId)) {
      beforeSaveRef.current.set(selectedFeatureId, prevFeature);
    }

    const updatedFeature = JSON.parse(JSON.stringify(selectedFeature));
    const line = updatedFeature.geometry.coordinates[node.lineIndex];

    // Insert new point **after** selected index
    const insertIndex = node.pointIndex === 0 ? 0 : node.pointIndex + 1;
    line.splice(insertIndex, 0, [latlng.lng, latlng.lat]);

    // Create and push action to undo stack
    const action = createAction('insert-node', selectedFeatureId, prevFeature, updatedFeature);
    pushToUndoStack(action);

    applyFeatureChange(updatedFeature);
    return insertIndex;
  };

  const updateNode = async (nodeIndex, newLatLng) => {
    const selectedFeature = roadGeojson?.features?.find(
      (f) => f.properties.roadid === selectedFeatureId
    );
    if (!selectedFeature) return;

    const node = nodes.find((n) => n.index === nodeIndex);
    if (!node) return;

    const prevFeature = JSON.parse(JSON.stringify(selectedFeature));

    if (!beforeSaveRef.current.has(selectedFeatureId)) {
      beforeSaveRef.current.set(selectedFeatureId, prevFeature);
    }

    const updatedFeature = JSON.parse(JSON.stringify(selectedFeature));
    updatedFeature.geometry.coordinates[node.lineIndex][node.pointIndex] = [
      newLatLng.lng,
      newLatLng.lat,
    ];

    // Create and push action to undo stack
    const action = createAction('update-node', selectedFeatureId, prevFeature, updatedFeature);
    pushToUndoStack(action);

    applyFeatureChange(updatedFeature);
  };

  const deleteNode = (nodeIndex) => {
    const selectedFeature = roadGeojson?.features?.find(
      (f) => f.properties.roadid === selectedFeatureId
    );
    if (!selectedFeature) return;

    const node = nodes.find((n) => n.index === nodeIndex);
    if (!node) return;

    const prevFeature = JSON.parse(JSON.stringify(selectedFeature));

    if (!beforeSaveRef.current.has(selectedFeatureId)) {
      beforeSaveRef.current.set(selectedFeatureId, prevFeature);
    }

    const updatedFeature = JSON.parse(JSON.stringify(selectedFeature));
    const updatedLine = updatedFeature.geometry.coordinates[node.lineIndex];

    // Remove the point
    updatedLine.splice(node.pointIndex, 1);

    // If a line becomes empty, remove that line
    if (updatedLine.length === 0) {
      updatedFeature.geometry.coordinates.splice(node.lineIndex, 1);
    }

    // Create and push action to undo stack
    const action = createAction('delete-node', selectedFeatureId, prevFeature, updatedFeature);
    pushToUndoStack(action);

    applyFeatureChange(updatedFeature);
  };

  const onSaveChange = async (msg) => {
    const updates = [];
    for (const [roadId, feature] of updatedGeojson.current.entries()) {
      updates.push({ id: roadId, geometry: feature.geometry });
    }
    const response = await fetch("/api/geojson/update-road", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates, edited_by: user, edit_reason: msg })
    });
    if (!response.ok) throw new Error("Bulk save failed");
    updatedGeojson.current.clear();
    beforeSaveRef.current.clear();

    // Clear undo/redo stacks after successful save
    undoStack.current.length = 0;
    redoStack.current.length = 0;
  };

  const applyFeatureChange = (feature) => {
    const updated = JSON.parse(JSON.stringify(roadGeojson));
    const idx = updated.features.findIndex(f => f.properties.roadid === feature.properties.roadid);
    if (idx !== -1) {
      updated.features[idx] = feature;
      setRoadGeojson(updated);
      const layer = roadLayersRef.current.get(feature.properties.roadid);
      if (layer) {
        const latlngs = feature.geometry.coordinates.map(line => line.map(([lng, lat]) => [lat, lng]));
        layer.setLatLngs(latlngs);
      }
    }
    updatedGeojson.current.set(feature.properties.roadid, feature);
    socket.emit('road-edit', feature);
  };

  const undo = () => {
    if (undoStack.current.length === 0) return;

    const action = undoStack.current.pop();

    // Push current state to redo stack
    const currentFeature = roadGeojson.features.find(f => f.properties.roadid === action.roadId);
    if (currentFeature) {
      const redoAction = createAction(
        `redo-${action.type}`,
        action.roadId,
        action.beforeState,
        JSON.parse(JSON.stringify(currentFeature))
      );
      redoStack.current.push(redoAction);
    }

    // Apply the before state
    applyFeatureChange(action.beforeState);
  };

  const redo = () => {
    if (redoStack.current.length === 0) return;

    const action = redoStack.current.pop();

    // Push current state to undo stack
    const currentFeature = roadGeojson.features.find(f => f.properties.roadid === action.roadId);
    if (currentFeature) {
      const undoAction = createAction(
        action.type.replace('redo-', ''),
        action.roadId,
        JSON.parse(JSON.stringify(currentFeature)),
        action.afterState
      );
      undoStack.current.push(undoAction);
    }

    // Apply the after state
    applyFeatureChange(action.afterState);
  };

  const logClick = (roadid, timestamp) => {
    fetch(`api/roads/${roadid}/timestamp/${timestamp}/`)
      .then((res) => res.json())
      .then((res) => setHistoricalFeature(res));
  };

  const hideLog = () => {
    setHistoricalFeature(null);
  };

  useEffect(() => {
    if (!villageFeature && !roadGeojson) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      roadLayersRef.current.clear();
    }

    const layerGroup = L.featureGroup();

    if (villageFeature) {
      L.geoJSON(villageFeature, {
        style: {
          color: 'blue',
          weight: 2,
          dashArray: '4',
          fillOpacity: 0.1,
        },
      }).addTo(layerGroup);
    }

    if (roadGeojson) {
      L.geoJSON(roadGeojson, {
        style: (feature) => {
          const roadid = feature.properties.roadid;
          const isLocked = globalLockedRoads[roadid];
          const isMyLock = isMyRoad(roadid);
          
          return {
            color: isMyLock ? 'green' : isLocked ? '#aaa' : 'red',
            weight: 6,
            opacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
          const roadid = feature.properties.roadid;
          roadLayersRef.current.set(roadid, layer);

          layer.on('click', () => {
            if (tool !== 'select') return;
            if (globalLockedRoads[roadid] && globalLockedRoads[roadid] !== user) return;
            
            if (!isMyRoad(roadid)) {
              lockRoad(roadid, user);
            }
            setSelectedFeatureId(roadid);
            setSelectedRoadId(roadid);
            fetch(`/api/roads/${roadid}/info/`).then(res => res.json()).then(setRoadInfo);
            setShowRoadInfo(true);
          });

          if (globalLockedRoads[roadid] && globalLockedRoads[roadid] !== user) {
            layer.bindTooltip(`Locked by ${globalLockedRoads[roadid]}`, { permanent: false, direction: 'top' });
          }

          layerGroup.addLayer(layer);
        }
      });
    }

    if (historicalFeature) {
      L.geoJSON(historicalFeature, {
        style: {
          color: 'orange',
          weight: 4,
          opacity: 0.8,
        }
      }).addTo(layerGroup);
    }

    layerGroup.addTo(map);
    layerRef.current = layerGroup;

    if (!hasZoomed.current) {
      const bounds = layerGroup.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { animate: false });
        hasZoomed.current = true;
      }
    }
  }, [villageFeature, roadGeojson, selectedFeatureId, globalLockedRoads, lockedRoads, tool, historicalFeature, isMyRoad, user]);

  useEffect(() => {
    const handleUnload = () => {
      if (selectedFeatureId) {
        unlockRoad(selectedFeatureId);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [selectedFeatureId, unlockRoad]);

  return (
    <>
      {nodes.map((node) => (
        <Marker
          key={node.index}
          position={[node.lat, node.lng]}
          icon={createNodeIcon(tool)}
          draggable={tool === 'move-node' || tool === 'add-node'}
          eventHandlers={{
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              updateNode(node.index, latlng);
            },
            click: () => {
              if (tool === 'delete-node') {
                deleteNode(node.index);
              } else if (tool === 'add-node') {
                setAddAfterNodeIndex(node.index);
              }
            }
          }}
        />
      ))}
    </>
  );
};

export default function MapEditor({
  user,
  villageFeature,
  roadGeojson,
  setRoadGeojson,
}) {
  const defaultPosition = [10.8505, 76.2711];
  const mapRef = useRef(null);
  const { setLockedRoads, socket } = useMapTool();
  const [globalLockedRoads, setGlobalLockedRoads] = useState({});

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });

  useEffect(() => {
    socket.emit("request-locks");

    socket.on("road-updated", (data) => {
      setRoadGeojson((prev) => {
        const updatedFeatures = prev.features.map((f) =>
          f.properties.roadid === data.properties.roadid ? data : f
        );
        return { ...prev, features: updatedFeatures };
      });
    });

    socket.on("road-locked", ({ roadid, username }) => {
      setGlobalLockedRoads((prev) => ({ ...prev, [roadid]: username }));
    });

    socket.on("road-unlocked", ({ roadid }) => {
      setGlobalLockedRoads((prev) => {
        const copy = { ...prev };
        delete copy[roadid];
        return copy;
      });
    });

    socket.on("initial-locks", (locks) => {
      setGlobalLockedRoads(locks);
    });

    return () => {
      socket.off("road-updated");
      socket.off("road-locked");
      socket.off("road-unlocked");
      socket.off("initial-locks");
    };
  }, [setRoadGeojson]);

  return (
    <div className="flex-1">
      <MapContainer
        center={defaultPosition}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {(villageFeature || roadGeojson) && (
          <GeoJSONEditor
            user={user}
            villageFeature={villageFeature}
            globalLockedRoads={globalLockedRoads}
            roadGeojson={roadGeojson}
            setRoadGeojson={setRoadGeojson}
          />
        )}
      </MapContainer>
    </div>
  );
}