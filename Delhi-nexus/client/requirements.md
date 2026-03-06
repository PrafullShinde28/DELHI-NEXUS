## Packages

react-map-gl | Interactive maps for traffic and pollution visualization
mapbox-gl | Core mapping library
recharts | Data visualization charts (line, bar, area)
framer-motion | Smooth animations and transitions
date-fns | Date formatting for charts and logs
clsx | Utility for conditional class names
tailwind-merge | Utility for merging tailwind classes
react-map-gl | React components for Mapbox GL JS
mapbox-gl | Core mapping library
@types/mapbox-gl | TypeScript definitions for Mapbox GL
recharts | Data visualization and charting for dashboards
date-fns | Date formatting and manipulation

## Notes

Mapbox token will be needed in environment variables (VITE_MAPBOX_TOKEN).
Socket.io client should be initialized in a context or hook for real-time updates.
Dark mode is the default theme.

- Mapbox requires a token. Ensure `VITE_MAPBOX_TOKEN` is set in the environment, though a fallback dummy token is provided for visual structure.
- The app uses a dark "Geo-Intelligence" theme.
- WebSocket connects to the same origin (`window.location.host`) for real-time updates.
