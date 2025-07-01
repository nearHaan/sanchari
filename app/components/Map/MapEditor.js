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

// Custom node icon
const createNodeIcon = () =>
  L.divIcon({
    className: "",
    html: `<div class="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-md hover:scale-125 transition-transform duration-150"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

const GeoJSONEditor = ({
  villageFeature,
  roadGeojson,
  setRoadGeojson,
  selectedFeatureId,
  setSelectedFeatureId,
}) => {
  const map = useMap();
  const layerRef = useRef(null);
  const roadLayersRef = useRef(new Map());
  const [nodes, setNodes] = useState([]);
  const hasZoomed = useRef(false);

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") {
        setSelectedFeatureId(null);
        setNodes([]);
      }
    };
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("keydown", esc);
    };
  }, []);

  useEffect(() => {
    if (!villageFeature && !roadGeojson) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      roadLayersRef.current.clear();
    }

    const layerGroup = L.featureGroup();

    // Add village polygon
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

    // Add road lines
    if (roadGeojson) {
      L.geoJSON(roadGeojson, {
        style: (feature) => ({
          color:
            selectedFeatureId === feature.properties.roadid ? "green" : "red",
          weight: 6,
          opacity: 0.7,
        }),
        onEachFeature: (feature, layer) => {
          if (feature.geometry.type === "MultiLineString") {
            roadLayersRef.current.set(feature.properties.id, layer);

            layer.on("click", () => {
              setSelectedFeatureId(feature.properties.roadid);

              const coords = [];
              feature.geometry.coordinates.forEach((line, lineIdx) => {
                line.forEach((point, pointIdx) => {
                  if (!Array.isArray(point)) return;
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
  }, [villageFeature, roadGeojson, selectedFeatureId]);

  const updateNode = (nodeIndex, newLatLng) => {
    const selectedFeature = roadGeojson?.features?.find(
      (f) => f.properties.roadid === selectedFeatureId
    );
    if (!selectedFeature) return;

    const node = nodes.find((n) => n.index === nodeIndex);
    if (!node) return;

    // Clone safely
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

    const layer = roadLayersRef.current.get(selectedFeatureId);
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
  villageFeature,
  roadGeojson,
  setRoadGeojson,
}) {
  const defaultPosition = [10.8505, 76.2711];
  const mapRef = useRef(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });

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
            villageFeature={villageFeature}
            roadGeojson={roadGeojson}
            setRoadGeojson={setRoadGeojson}
            selectedFeatureId={selectedFeatureId}
            setSelectedFeatureId={setSelectedFeatureId}
          />
        )}
      </MapContainer>
    </div>
  );
}
