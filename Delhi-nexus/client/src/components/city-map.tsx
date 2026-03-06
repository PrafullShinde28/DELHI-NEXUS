import maplibregl from "maplibre-gl";
import { useMemo, useState, useEffect } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  Source,
  Layer,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import type { LayerProps } from "react-map-gl/maplibre";
import { Car, Wind, AlertTriangle } from "lucide-react";

interface DataPoint {
  id: number;
  locationId: string;
  congestionIndex?: number;
  vehicleDensity?: number;
  aqi?: number;
  pm25?: number;
  pm10?: number;
}

interface Props {
  trafficData?: DataPoint[];
  pollutionData?: DataPoint[];
  alerts?: any[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function CityMap({
  trafficData = [],
  pollutionData = [],
  alerts = [],
  center = { lat: 28.6139, lng: 77.209 },
  zoom = 11,
}: Props) {

  const [viewState, setViewState] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom,
  });

  const [selected, setSelected] = useState<any>(null);

  /* ---------- Fake Coordinates ---------- */
  const getCoords = (id: string, i: number) => ({
    lat: center.lat + Math.sin(i * 132.1) * 0.05,
    lng: center.lng + Math.cos(i * 42.7) * 0.05,
  });

  /* ---------- GEOJSON POINTS ---------- */
  const points = useMemo(() => {
    const all = [...trafficData, ...pollutionData];

    return all.map((d, i) => {
      const c = getCoords(d.locationId, i);
      return {
        type: "Feature",
        properties: { ...d, lat: c.lat, lng: c.lng },
        geometry: {
          type: "Point",
          coordinates: [c.lng, c.lat],
        },
      } as GeoJSON.Feature<GeoJSON.Point>;
    });
  }, [trafficData, pollutionData]);

  /* ---------- CLUSTER ---------- */
  const cluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 60,
      maxZoom: 16,
    });
    sc.load(points as any);
    return sc;
  }, [points]);

  const clusters = useMemo(
    () => cluster.getClusters([-180, -85, 180, 85], Math.round(viewState.zoom)),
    [cluster, viewState.zoom]
  );

  /* ---------- HEATMAP ---------- */
  const heatmapLayer: LayerProps = {
    id: "heat",
    type: "heatmap",
    paint: {
      "heatmap-weight": 1,
      "heatmap-radius": 35,
      "heatmap-intensity": 1.2,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0, "rgba(0,0,255,0)",
        0.2, "blue",
        0.4, "cyan",
        0.6, "lime",
        0.8, "yellow",
        1, "red",
      ],
    },
  };

  /* ---------- AQI LIVE ANIMATION ---------- */
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setPulse((p) => (p + 1) % 100);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  /* ---------- RENDER ---------- */
  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden relative border border-border shadow-xl">

      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        mapLib={maplibregl}
        style={{ width: "100%", height: "100%" }}
      >
        {/* CONTROLS */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* HEATMAP */}
        <Source id="points" type="geojson" data={{ type: "FeatureCollection", features: points }}>
          <Layer {...heatmapLayer} />
        </Source>

        {/* CLUSTERS + MARKERS */}
        {clusters.map((c: any) => {
          const [lng, lat] = c.geometry.coordinates;
          const isCluster = c.properties.cluster;

          if (isCluster) {
            return (
              <Marker key={`cluster-${c.id}`} longitude={lng} latitude={lat}>
                <div className="bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-bold shadow-lg">
                  {c.properties.point_count}
                </div>
              </Marker>
            );
          }

          const p = c.properties;
          const isTraffic = p.congestionIndex !== undefined;
          const isPollution = p.aqi !== undefined;

          return (
            <Marker key={p.id} longitude={lng} latitude={lat}>
              <button
                className="transform transition-all duration-200 hover:scale-150"
                onClick={() => setSelected(p)}
              >
                {isTraffic && (
                  <div className={`p-2 rounded-full ${
                    p.congestionIndex > 7 ? "bg-red-500"
                    : p.congestionIndex > 4 ? "bg-yellow-400"
                    : "bg-green-500"
                  }`}>
                    <Car className="w-4 h-4 text-white"/>
                  </div>
                )}

                {isPollution && (
                  <div
                    className={`p-2 rounded-full ${
                      p.aqi > 200 ? "bg-purple-600"
                      : p.aqi > 100 ? "bg-red-500"
                      : p.aqi > 50 ? "bg-yellow-400"
                      : "bg-green-500"
                    }`}
                    style={{
                      boxShadow: `0 0 ${8 + pulse}px rgba(255,0,0,0.7)`
                    }}
                  >
                    <Wind className="w-4 h-4 text-white"/>
                  </div>
                )}
              </button>
            </Marker>
          );
        })}

        {/* ALERTS */}
        {alerts.map((a, i) => {
          const c = getCoords(a.locationId, i + 200);
          return (
            <Marker key={`alert-${i}`} longitude={c.lng} latitude={c.lat}>
              <AlertTriangle className="text-red-600 w-7 h-7 animate-bounce"/>
            </Marker>
          );
        })}

        {/* POPUP */}
        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            onClose={() => setSelected(null)}
            anchor="bottom"
            closeButton
            closeOnClick={false}
          >
            <div className="text-white min-w-[220px] bg-neutral-900 p-3 rounded-lg">
              <div className="font-semibold border-b border-white/20 pb-2 mb-2">
                {selected.locationId}
              </div>

              {selected.aqi && (
                <>
                  <div className="flex justify-between">
                    <span>AQI</span>
                    <span className="font-bold text-yellow-300">{selected.aqi}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>PM2.5</span>
                    <span>{selected.pm25}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>PM10</span>
                    <span>{selected.pm10}</span>
                  </div>
                </>
              )}

              {selected.congestionIndex && (
                <>
                  <div className="flex justify-between">
                    <span>Congestion</span>
                    <span>{selected.congestionIndex.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Vehicles/hr</span>
                    <span>{selected.vehicleDensity}</span>
                  </div>
                </>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* LEGEND */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-xl text-xs space-y-2">
        <div className="font-semibold">Legend</div>
        <div className="flex gap-2 items-center"><Car className="w-4"/> Traffic</div>
        <div className="flex gap-2 items-center"><Wind className="w-4"/> Air Quality</div>
        <div className="flex gap-2 items-center"><AlertTriangle className="w-4"/> Alerts</div>
        <div className="flex gap-2 items-center"><div className="w-4 h-4 bg-red-500 rounded-full"/> Heat Density</div>
      </div>

    </div>
  );
}
