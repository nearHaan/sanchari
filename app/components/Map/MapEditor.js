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
import { io } from "socket.io-client";
import { useMapTool } from "@/app/context/MapToolContext";

// WebSocket connection
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const createNodeIcon = () =>
  L.divIcon({
    className: "",
    html: `<div class="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-md hover:scale-125 transition-transform duration-150"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

const GeoJSONEditor = ({
  user,
  setSelectedRoadId,
  villageFeature,
  setUpdatedGeojson,
  roadGeojson,
  setRoadGeojson,
  selectedFeatureId,
  setSelectedFeatureId,
  lockedRoads,
  setLockedRoads,
  setRoadInfo = { setRoadInfo },
  setShowRoadInfo,
}) => {
  const map = useMap();
  const layerRef = useRef(null);
  const roadLayersRef = useRef(new Map());
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const beforeSave = useRef(null);
  const [nodes, setNodes] = useState([]);
  const hasZoomed = useRef(false);
  const { tool, setTool, cancelEditRef } = useMapTool();

  useEffect(() => {
    if (!tool || !map) {
      setTool('move');
    }

    if (tool === 'move') {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }

    if (tool == 'zoom-in') {
      map.zoomIn();
      setTool('');
    }

    if (tool == 'zoom-out') {
      map.zoomOut();
      setTool('');
    }

    if (tool == 'undo') {
      undo();
      setTool('');
    }

    if (tool == 'redo') {
      redo();
      setTool('');
    }
  }, [tool, map]);

  useEffect(() => {
    cancelEditRef.current = onCancelChange;
  }, [roadGeojson, selectedFeatureId]);

  useEffect(() => {
    const esc = (e) => {
      if (e.key === 'Escape' && selectedFeatureId) {
        socket.emit('road-unlock', { roadid: selectedFeatureId });
        setSelectedFeatureId(null);
        setShowRoadInfo(false);
        setSelectedRoadId(null);
        setNodes([]);
        undoStack.current = [];
        redoStack.current = [];
      }
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [selectedFeatureId]);

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
          const isLocked = lockedRoads[roadid];
          return {
            color:
              selectedFeatureId === roadid
                ? 'green'
                : isLocked
                  ? '#aaa'
                  : 'red',
            weight: 6,
            opacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.geometry.type !== 'MultiLineString') return;

          roadLayersRef.current.set(feature.properties.roadid, layer);

          layer.on('click', () => {
            if (tool !== "select") return;
            const roadid = feature.properties.roadid;
            if (lockedRoads[roadid]) return;
            const currentFeature = roadGeojson?.features?.find(f => f.properties.roadid === selectedFeatureId);
            if (beforeSave.current && currentFeature && currentFeature !== beforeSave.current) {
              const confirmed = window.alert('Either save or discard your current edit to select another road');
              return;
            }


            if (selectedFeatureId && selectedFeatureId !== roadid) {
              socket.emit('road-unlock', { roadid: selectedFeatureId });
            }

            setSelectedFeatureId(roadid);
            setSelectedRoadId(roadid);
            fetch(`api/roads/${roadid}/info/`)
              .then((res) => res.json())
              .then((res) => setRoadInfo(res));
            setShowRoadInfo(true);
            socket.emit('road-lock', { roadid, username: user });

            const coords = [];
            feature.geometry.coordinates.forEach((line, lineIdx) => {
              line.forEach((point, pointIdx) => {
                const [lng, lat] = point;
                coords.push({
                  lat,
                  lng,
                  index: coords.length,
                  lineIndex: lineIdx,
                  pointIndex: pointIdx,
                });
              });
            });

            setNodes(coords);
            undoStack.current = [];
            redoStack.current = [];
          });

          const roadid = feature.properties.roadid;
          if (lockedRoads[roadid]) {
            layer.bindTooltip(`Being edited by ${lockedRoads[roadid]}`, {
              permanent: false,
              direction: 'top',
            });
          }

          layerGroup.addLayer(layer);
        },
      });
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
  }, [villageFeature, roadGeojson, selectedFeatureId, lockedRoads, tool, beforeSave]);

  useEffect(() => {
    const handleUnload = () => {
      if (selectedFeatureId) {
        socket.emit('road-unlock', { roadid: selectedFeatureId });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [selectedFeatureId]);

  const updateNode = async (nodeIndex, newLatLng) => {
    const selectedFeature = roadGeojson?.features?.find(
      (f) => f.properties.roadid === selectedFeatureId
    );
    if (!selectedFeature) return;

    const node = nodes.find((n) => n.index === nodeIndex);
    if (!node) return;

    const prevFeature = JSON.parse(JSON.stringify(selectedFeature));
    undoStack.current.push(prevFeature);
    if (!beforeSave.current) {
      beforeSave.current = prevFeature;
    }
    redoStack.current = [];

    const updatedFeature = JSON.parse(JSON.stringify(selectedFeature));
    updatedFeature.geometry.coordinates[node.lineIndex][node.pointIndex] = [
      newLatLng.lng,
      newLatLng.lat,
    ];

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
    undoStack.current.push(prevFeature);
    if (!beforeSave.current) {
      beforeSave.current = prevFeature;
    }
    redoStack.current = [];

    const updatedFeature = JSON.parse(JSON.stringify(selectedFeature));
    const updatedLine = updatedFeature.geometry.coordinates[node.lineIndex];

    // Remove the point
    updatedLine.splice(node.pointIndex, 1);

    // If a line becomes empty, remove that line
    if (updatedLine.length === 0) {
      updatedFeature.geometry.coordinates.splice(node.lineIndex, 1);
    }

    applyFeatureChange(updatedFeature);
  };


  const onCancelChange = () => {
    if (!beforeSave.current) return;
    applyFeatureChange(beforeSave.current);
  }

  const applyFeatureChange = (feature) => {
    const updatedGeojson = JSON.parse(JSON.stringify(roadGeojson));
    const featureIndex = updatedGeojson.features.findIndex(
      (f) => f.properties.roadid === feature.properties.roadid
    );
    if (featureIndex !== -1) {
      updatedGeojson.features[featureIndex] = feature;
      setRoadGeojson(updatedGeojson);
    }

    const layer = roadLayersRef.current.get(feature.properties.roadid);
    if (layer) {
      const latlngs = feature.geometry.coordinates.map((line) =>
        line.map(([lng, lat]) => [lat, lng])
      );
      layer.setLatLngs(latlngs);
    }

    const coords = [];
    feature.geometry.coordinates.forEach((line, lineIdx) => {
      line.forEach((point, pointIdx) => {
        const [lng, lat] = point;
        coords.push({
          lat,
          lng,
          index: coords.length,
          lineIndex: lineIdx,
          pointIndex: pointIdx,
        });
      });
    });
    setNodes(coords);
    socket.emit('road-edit', feature);
    setUpdatedGeojson(feature);
  };

  const undo = () => {
    if (!selectedFeatureId || undoStack.current.length === 0) return;
    const prevFeature = undoStack.current.pop();
    const currentFeature = roadGeojson.features.find(
      (f) => f.properties.roadid === selectedFeatureId
    );
    redoStack.current.push(JSON.parse(JSON.stringify(currentFeature)));
    applyFeatureChange(prevFeature);
  };

  const redo = () => {
    if (!selectedFeatureId || redoStack.current.length === 0) return;
    const nextFeature = redoStack.current.pop();
    const currentFeature = roadGeojson.features.find(
      (f) => f.properties.roadid === selectedFeatureId
    );
    undoStack.current.push(JSON.parse(JSON.stringify(currentFeature)));
    applyFeatureChange(nextFeature);
  };

  return (
    <>
      {nodes.map((node) => (
        <Marker
          key={node.index}
          position={[node.lat, node.lng]}
          icon={createNodeIcon()}
          draggable={tool === 'move-node'}
          eventHandlers={{
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              updateNode(node.index, latlng);
            },
            click: () => {
              if (tool === 'delete-node') {
                deleteNode(node.index);
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
  setSelectedRoadId,
  setUpdatedGeojson,
  villageFeature,
  roadGeojson,
  setRoadGeojson,
  setRoadInfo,
  setShowRoadInfo,
}) {
  const defaultPosition = [10.8505, 76.2711];
  const mapRef = useRef(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [lockedRoads, setLockedRoads] = useState({});

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });

  useEffect(() => {
    socket.emit("request-locks"); // 👈 Request locks after client connects

    socket.on("road-updated", (data) => {
      setRoadGeojson((prev) => {
        const updatedFeatures = prev.features.map((f) =>
          f.properties.roadid === data.properties.roadid ? data : f
        );
        return { ...prev, features: updatedFeatures };
      });
    });

    socket.on("road-locked", ({ roadid, username }) => {
      setLockedRoads((prev) => ({ ...prev, [roadid]: username }));
    });

    socket.on("road-unlocked", ({ roadid }) => {
      setLockedRoads((prev) => {
        const copy = { ...prev };
        delete copy[roadid];
        return copy;
      });
    });

    socket.on("initial-locks", (locks) => {
      setLockedRoads(locks);
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
            setSelectedRoadId={setSelectedRoadId}
            setUpdatedGeojson={setUpdatedGeojson}
            villageFeature={villageFeature}
            roadGeojson={roadGeojson}
            setRoadGeojson={setRoadGeojson}
            selectedFeatureId={selectedFeatureId}
            setSelectedFeatureId={setSelectedFeatureId}
            lockedRoads={lockedRoads}
            setLockedRoads={setLockedRoads}
            setRoadInfo={setRoadInfo}
            setShowRoadInfo={setShowRoadInfo}
          />
        )}
      </MapContainer>
    </div>
  );
}
