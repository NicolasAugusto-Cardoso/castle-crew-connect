import { useEffect, useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MAPBOX_TOKEN } from '@/config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CollaboratorMapProps {
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  name: string;
}

export function CollaboratorMap({ 
  street, 
  streetNumber, 
  neighborhood, 
  city, 
  state, 
  postalCode, 
  name 
}: CollaboratorMapProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const mapboxToken = MAPBOX_TOKEN;

  useEffect(() => {
    
    const geocodeAddress = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: {
            street,
            streetNumber,
            neighborhood,
            city,
            state,
            postalCode
          }
        });

        if (!error && data?.latitude && data?.longitude) {
          console.log("CollaboratorMap - Coordenadas recebidas:", data.latitude, data.longitude);
          setCoordinates({ lat: data.latitude, lng: data.longitude });
        } else {
          console.error("CollaboratorMap - Erro na geocodificação:", error);
          setMapError("Não foi possível localizar o endereço");
        }
      } catch (error) {
        console.error('CollaboratorMap - Erro ao geocodificar:', error);
        setMapError("Erro ao carregar localização");
      } finally {
        setLoading(false);
      }
    };

      geocodeAddress();
  }, [street, streetNumber, neighborhood, city, state, postalCode]);

  if (loading) {
    return (
      <div className="relative w-full min-h-[240px] h-[300px] rounded-lg overflow-hidden border border-border shadow-md flex items-center justify-center bg-muted/20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="relative w-full min-h-[240px] h-[300px] rounded-lg overflow-hidden border border-border shadow-md flex flex-col items-center justify-center gap-2 bg-muted/20 p-4">
        <AlertCircle className="w-6 h-6 text-destructive" />
        <p className="text-sm text-muted-foreground text-center">
          {mapError}
        </p>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className="relative w-full min-h-[240px] h-[300px] rounded-lg overflow-hidden border border-border shadow-md flex items-center justify-center bg-muted/20">
        <p className="text-sm text-muted-foreground">Não foi possível carregar o mapa</p>
      </div>
    );
  }

  try {
    return (
      <div className="relative w-full min-h-[240px] h-[300px] rounded-lg overflow-hidden border border-border shadow-md">
        <Map
          initialViewState={{
            longitude: coordinates.lng,
            latitude: coordinates.lat,
            zoom: 14
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={mapboxToken}
          onError={(error) => {
            console.error("CollaboratorMap - Erro do Mapbox:", error);
            setMapError("Erro ao renderizar o mapa");
          }}
        >
          <Marker 
            longitude={coordinates.lng} 
            latitude={coordinates.lat} 
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
  } catch (error) {
    console.error("CollaboratorMap - Erro ao renderizar:", error);
    return (
      <div className="relative w-full min-h-[240px] h-[300px] rounded-lg overflow-hidden border border-border shadow-md flex flex-col items-center justify-center gap-2 bg-muted/20 p-4">
        <AlertCircle className="w-6 h-6 text-destructive" />
        <p className="text-sm text-muted-foreground">Erro ao carregar o mapa</p>
      </div>
    );
  }
}
