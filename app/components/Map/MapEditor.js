"use client";

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

// WebSocket connection
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL); // 👈 Use public env var

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
}) => {
  const map = useMap();
  const layerRef = useRef(null);
  const roadLayersRef = useRef(new Map());
  const [nodes, setNodes] = useState([]);
  const hasZoomed = useRef(false);

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape" && selectedFeatureId) {
        socket.emit("road-unlock", { roadid: selectedFeatureId });
        setSelectedFeatureId(null);
        setNodes([]);
      }
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [selectedFeatureId]);

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
          color: "blue",
          weight: 2,
          dashArray: "4",
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
                ? "green"
                : isLocked
                  ? "#aaa"
                  : "red",
            weight: 6,
            opacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.geometry.type !== "MultiLineString") return;

          roadLayersRef.current.set(feature.properties.roadid, layer);

          layer.on("click", () => {
            const roadid = feature.properties.roadid;
            if (lockedRoads[roadid]) return;

            if (selectedFeatureId && selectedFeatureId !== roadid) {
              socket.emit("road-unlock", { roadid: selectedFeatureId });
            }

            setSelectedFeatureId(roadid);
            setSelectedRoadId(roadid);
            socket.emit("road-lock", { roadid, username: user });

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
          });

          const roadid = feature.properties.roadid;
          if (lockedRoads[roadid]) {
            layer.bindTooltip(`Being edited by ${lockedRoads[roadid]}`, {
              permanent: false,
              direction: "top",
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
  }, [villageFeature, roadGeojson, selectedFeatureId, lockedRoads]);

  useEffect(() => {
    const handleUnload = () => {
      if (selectedFeatureId) {
        socket.emit("road-unlock", { roadid: selectedFeatureId });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [selectedFeatureId]);


  const updateNode = async (nodeIndex, newLatLng) => {
    const selectedFeature = roadGeojson?.features?.find(
      (f) => f.properties.roadid === selectedFeatureId
    );
    if (!selectedFeature) return;

    const node = nodes.find((n) => n.index === nodeIndex);
    if (!node) return;

    const updatedFeature = JSON.parse(JSON.stringify(selectedFeature));
    updatedFeature.geometry.coordinates[node.lineIndex][node.pointIndex] = [
      newLatLng.lng,
      newLatLng.lat,
    ];

    const updatedGeojson = JSON.parse(JSON.stringify(roadGeojson));
    const featureIndex = updatedGeojson.features.findIndex(
      (f) => f.properties.roadid === selectedFeatureId
    );
    if (featureIndex !== -1) {
      updatedGeojson.features[featureIndex] = updatedFeature;
      setRoadGeojson(updatedGeojson);
    }

    const layer = roadLayersRef.current.get(selectedFeature.roadid);
    if (layer) {
      const latlngs = updatedFeature.geometry.coordinates.map((line) =>
        line.map(([lng, lat]) => [lat, lng])
      );
      layer.setLatLngs(latlngs);
    }

    setNodes((prev) =>
      prev.map((n) =>
        n.index === nodeIndex
          ? { ...n, lat: newLatLng.lat, lng: newLatLng.lng }
          : n
      )
    );

    socket.emit("road-edit", updatedFeature);
    setUpdatedGeojson(updatedFeature);
  };

  return (
    <>
      {nodes.map((node) => (
        <Marker
          key={node.index}
          position={[node.lat, node.lng]}
          icon={createNodeIcon()}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              updateNode(node.index, latlng);
            },
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
          />
        )}
      </MapContainer>
    </div>
  );
}
