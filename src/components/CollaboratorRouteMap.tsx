import { useEffect, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CollaboratorAddress {
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

interface CollaboratorRouteMapProps {
  collaboratorAddress: CollaboratorAddress;
  collaboratorName: string;
}

export function CollaboratorRouteMap({ 
  collaboratorAddress,
  collaboratorName 
}: CollaboratorRouteMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [collaboratorLocation, setCollaboratorLocation] = useState<[number, number] | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Obter localização do usuário
        if (!navigator.geolocation) {
          setError('Geolocalização não é suportada pelo seu navegador');
          setLoading(false);
          return;
        }

        const userPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const userLat = userPosition.coords.latitude;
        const userLng = userPosition.coords.longitude;
        setUserLocation([userLng, userLat]);

        // 2. Geocodificar endereço do colaborador
        const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-address', {
          body: {
            street: collaboratorAddress.street,
            streetNumber: collaboratorAddress.streetNumber,
            neighborhood: collaboratorAddress.neighborhood,
            city: collaboratorAddress.city,
            state: collaboratorAddress.state,
            postalCode: collaboratorAddress.postalCode
          }
        });

        if (geoError || !geoData?.latitude || !geoData?.longitude) {
          setError('Não foi possível encontrar o endereço do colaborador');
          setLoading(false);
          return;
        }

        const collabLat = geoData.latitude;
        const collabLng = geoData.longitude;
        setCollaboratorLocation([collabLng, collabLat]);

        // 3. Calcular rota usando Mapbox Directions API
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${collabLng},${collabLat}?geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteGeometry(route.geometry);
          
          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMin = Math.round(route.duration / 60);
          setRouteInfo({
            distance: `${distanceKm} km`,
            duration: `${durationMin} min`
          });
        } else {
          setError('Não foi possível calcular a rota');
        }
      } catch (err: any) {
        if (err.message?.includes('User denied')) {
          setError('Permita o acesso à sua localização para calcular a rota');
        } else {
          setError('Erro ao calcular rota');
        }
        console.error('Erro ao calcular rota:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();
  }, [collaboratorAddress]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Calculando rota...</p>
        </div>
      </div>
    );
  }

  if (error || !userLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Erro ao carregar mapa'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        initialViewState={{
          longitude: userLocation && collaboratorLocation 
            ? (userLocation[0] + collaboratorLocation[0]) / 2 
            : userLocation?.[0] || 0,
          latitude: userLocation && collaboratorLocation 
            ? (userLocation[1] + collaboratorLocation[1]) / 2 
            : userLocation?.[1] || 0,
          zoom: 11
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      >
        {/* Marcador do usuário */}
        {userLocation && (
          <Marker 
            longitude={userLocation[0]} 
            latitude={userLocation[1]} 
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="bg-blue-500 rounded-full p-2 shadow-lg">
                <MapPin className="w-5 h-5 text-white" fill="white" />
              </div>
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded mt-1 shadow-lg whitespace-nowrap">
                Você
              </div>
            </div>
          </Marker>
        )}

        {/* Marcador do colaborador */}
        {collaboratorLocation && (
          <Marker 
            longitude={collaboratorLocation[0]} 
            latitude={collaboratorLocation[1]} 
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="bg-primary rounded-full p-2 shadow-lg">
                <MapPin className="w-5 h-5 text-primary-foreground" fill="currentColor" />
              </div>
              <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded mt-1 shadow-lg whitespace-nowrap">
                {collaboratorName}
              </div>
            </div>
          </Marker>
        )}

        {/* Linha da rota */}
        {routeGeometry && (
          <Source id="route" type="geojson" data={routeGeometry}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                'line-color': 'hsl(var(--primary))',
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}
      </Map>

      {/* Info da rota */}
      {routeInfo && (
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3 text-sm">
            <div>
              <span className="font-semibold">{routeInfo.distance}</span>
              <span className="text-muted-foreground"> • </span>
              <span className="font-semibold">{routeInfo.duration}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
