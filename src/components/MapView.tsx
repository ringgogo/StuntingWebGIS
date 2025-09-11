/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";

interface MapViewProps {
  selectedFile: string;
  labelField: string;
}

const defaultStyle: L.PathOptions = {
  color: "#000",
  weight: 1,
  fillColor: "#fff",
  fillOpacity: 0.8,
};

const highlightStyle: L.PathOptions = {
  color: "#f00",
  weight: 2,
  fillColor: "#f99",
  fillOpacity: 0.7,
};

function getCentroid(feature: any): [number, number] | null {
  if (!feature || !feature.geometry) return null;
  const g = feature.geometry;
  if (g.type === "Point") {
    // GeoJSON coordinate [lng, lat]
    return [g.coordinates[1], g.coordinates[0]];
  }
  let ring: number[][] = [];
  if (g.type === "Polygon") {
    ring = g.coordinates?.[0] ?? [];
  } else if (g.type === "MultiPolygon") {
    ring = g.coordinates?.[0]?.[0] ?? [];
  } else {
    return null;
  }
  if (!ring.length) return null;
  let latSum = 0,
    lngSum = 0;
  ring.forEach((c: number[]) => {
    lngSum += c[0];
    latSum += c[1];
  });
  return [latSum / ring.length, lngSum / ring.length];
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    let resizeTimeout: any;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        map.invalidateSize();
      }, 200);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [map]);
  return null;
}

function GeoJSONLoader({ selectedFile, labelField }: MapViewProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);
  const labelRef = useRef<L.LayerGroup | null>(null);
  const highlightedRef = useRef<L.Layer | null>(null);

  // mapping biar gampang
  const labelMap = useRef<Map<string, L.Marker>>(new Map());
  const areaMap = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
    if (!selectedFile) return;
    let cancelled = false;

    // clear sebelumnya
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (labelRef.current) {
      map.removeLayer(labelRef.current);
      labelRef.current = null;
    }
    highlightedRef.current = null;
    labelMap.current.clear();
    areaMap.current.clear();

    fetch(`/${selectedFile}`)
      .then((res) => {
        if (!res.ok) throw new Error("File tidak ditemukan");
        return res.json();
      })
      .then((raw) => {
        if (cancelled) return;

        const data =
          raw && raw.type === "FeatureCollection"
            ? raw
            : { type: "FeatureCollection", features: [raw] };

        // --- buat geojson layer ---
        const geoLayer = L.geoJSON(data as any, {
          style: () => ({
            ...defaultStyle,
          }),
          onEachFeature: (feature: any, layer: L.Layer) => {
            const name = feature?.properties?.[labelField] ?? "";

            if (name) {
              areaMap.current.set(name, layer);
            }

            layer.on({
              click: () => {
                layerRef.current?.eachLayer((l: any) => {
                  try {
                    layerRef.current?.resetStyle(l);
                  } catch { /* empty */ }
                });
                try {
                  (layer as any).setStyle(highlightStyle);
                } catch { /* empty */ }
                highlightedRef.current = layer;

                const evt = new CustomEvent("feature-click", {
                  detail: {
                    properties: feature.properties,
                    isKecamatan: selectedFile
                      .toLowerCase()
                      .includes("batas kecamatan"),
                  },
                });
                window.dispatchEvent(evt);
              },
              mouseover: () => {
                highlightAreaAndLabel(name);
              },
              mouseout: () => {
                resetAreaAndLabel(name, layer);
              },
            });
          },
        }).addTo(map);

        layerRef.current = geoLayer;

        // --- buat label centroid ---
        const labels: L.Marker[] = [];
        const placedPoints: [number, number][] = [];
        const minDistance = 0.02;

        (data.features || []).forEach((f: any) => {
          const c = getCentroid(f);
          if (!c) return;

          const tooClose = placedPoints.some((p) => {
            const dLat = p[0] - c[0];
            const dLng = p[1] - c[1];
            return Math.sqrt(dLat * dLat + dLng * dLng) < minDistance;
          });
          if (tooClose) return;
          placedPoints.push(c);

          const labelText = f.properties?.[labelField] ?? "";
          const marker = L.marker([c[0], c[1]], {
            icon: L.divIcon({
              className: "geojson-label",
              html: `<span>${labelText}</span>`,
              iconSize: [100, 100],
              iconAnchor: [30, 40],
            }),
            interactive: true,
          });

          // simpan mapping
          labelMap.current.set(labelText, marker);

          marker.on("click", () => {
            const evt = new CustomEvent("feature-click", {
              detail: {
                properties: f.properties,
                isKecamatan: selectedFile.toLowerCase().includes("batas kecamatan"),
              },
            });
            window.dispatchEvent(evt);
          });

          // event hover label → highlight area
          marker.on("mouseover", () => {
            highlightAreaAndLabel(labelText);
          });
          marker.on("mouseout", () => {
            const area = areaMap.current.get(labelText);
            if (area) {
              resetAreaAndLabel(labelText, area);
            }
          });

          labels.push(marker);
        });

        if (labels.length) {
          const lg = L.layerGroup(labels).addTo(map);
          labelRef.current = lg;
          try {
            (labelRef.current as any).setZIndex?.(1000);
          } catch { /* empty */ }
        }

        // fit bounds
        try {
          const bounds = geoLayer.getBounds();
          if (bounds && bounds.isValid && bounds.isValid()) {
            map.fitBounds(bounds, { animate: false, padding: [20, 20] });
          }
        } catch { /* empty */ }

        const resetEvt = new CustomEvent("layer-loaded", {
          detail: { file: selectedFile },
        });
        window.dispatchEvent(resetEvt);
      })
      .catch((err) => {
        console.error("Gagal memuat GeoJSON:", err);
      });

    return () => {
      cancelled = true;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      if (labelRef.current) {
        map.removeLayer(labelRef.current);
        labelRef.current = null;
      }
      highlightedRef.current = null;
      labelMap.current.clear();
      areaMap.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, labelField]);

  // --- helper highlight ---
  const highlightAreaAndLabel = (name: string) => {
    const area = areaMap.current.get(name);
    if (area) {
      (area as any).setStyle({
        weight: 3,
        color: "#f00",
        fillColor: "#f88",
        fillOpacity: 0.5,
      });
      (area as any).bringToFront();
    }
    const marker = labelMap.current.get(name);
    if (marker) {
      const el = marker.getElement()?.querySelector("span");
      if (el) {
        el.style.fontSize = "16px";
        el.style.textShadow = "0 0 6px red";
        el.style.transition = "all 0.2s ease-in-out";
      }
    }
  };

  const resetAreaAndLabel = (name: string, areaLayer: L.Layer) => {
    if (highlightedRef.current !== areaLayer) {
      layerRef.current?.resetStyle(areaLayer as any);
    }
    const marker = labelMap.current.get(name);
    if (marker) {
      const el = marker.getElement()?.querySelector("span");
      if (el) {
        el.style.fontSize = "14px";
        el.style.color = "white";
        el.style.textShadow = "0 2px 3px black";
      }
    }
  };

  return null;
}



export default function MapView({ selectedFile, labelField }: MapViewProps) {
  // MapContainer tanpa TileLayer (kosong) — hanya GeoJSON akan dimasukkan
  return (
    <div className="flex-1 relative" style={{ width: "100%", height: "100%" }}>
      <MapContainer
        className="absolute inset-0 w-full h-[600px]"
        center={[1.917, 99.0682]}
        zoom={10}
        style={{ width: "100%", height: "100%", background: "#333" }}
        zoomControl={true}
        attributionControl={false}
      >
        <GeoJSONLoader selectedFile={selectedFile} labelField={labelField} />
        <MapResizeHandler />
      </MapContainer>
    </div>
  );
}
