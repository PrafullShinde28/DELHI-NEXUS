import maplibregl from "maplibre-gl";
import Map, {
  NavigationControl,
  FullscreenControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const DEFAULT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

interface MapContainerProps {
  children?: React.ReactNode;
  interactive?: boolean;
}

export default function MapContainer({
  children,
  interactive = true,
}: MapContainerProps) {
  return (
    <Map
      initialViewState={{
        longitude: 77.209,
        latitude: 28.6139,
        zoom: 10.2,
      }}
      mapStyle={DEFAULT_MAP_STYLE}
      mapLib={maplibregl}
      interactive={interactive}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="bottom-right" />
      <FullscreenControl position="bottom-right" />

      {children}
    </Map>
  );
}

/* NCR Zones */

export const NCR_ZONES = [
  { name: "Chandni Chowk", lat: 28.6505, lng: 77.2303 },
  { name: "Connaught Place", lat: 28.6304, lng: 77.2177 },
  { name: "Rohini", lat: 28.7041, lng: 77.1025 },
  { name: "Dwarka", lat: 28.5823, lng: 77.05 },
  { name: "Saket", lat: 28.5246, lng: 77.2066 },
  { name: "Lajpat Nagar", lat: 28.5677, lng: 77.2433 },
  { name: "Karol Bagh", lat: 28.651, lng: 77.1903 },
  { name: "Noida Sector 62", lat: 28.6208, lng: 77.3639 },
  { name: "Gurugram Cyber City", lat: 28.4905, lng: 77.0888 },
];
