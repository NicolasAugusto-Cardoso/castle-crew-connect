import Map, { Marker } from 'react-map-gl';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CollaboratorMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export function CollaboratorMap({ latitude, longitude, name }: CollaboratorMapProps) {
  return (
    <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-border shadow-md">
      <Map
        initialViewState={{
          longitude: longitude,
          latitude: latitude,
          zoom: 14
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      >
        <Marker 
          longitude={longitude} 
          latitude={latitude} 
          anchor="bottom"
        >
          <div className="flex flex-col items-center">
            <div className="bg-primary rounded-full p-2 shadow-lg">
              <MapPin className="w-6 h-6 text-primary-foreground" fill="currentColor" />
            </div>
            <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded mt-1 shadow-lg whitespace-nowrap">
              {name}
            </div>
          </div>
        </Marker>
      </Map>
    </div>
  );
}
