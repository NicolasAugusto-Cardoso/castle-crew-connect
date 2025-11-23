import { useEffect, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { MapPin, Loader2, AlertCircle, Navigation } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MAPBOX_TOKEN } from '@/config/mapbox';
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
  collaboratorLatitude?: number | null;
  collaboratorLongitude?: number | null;
  collaboratorUserId: string;
}

export function CollaboratorRouteMap({ 
  collaboratorAddress,
  collaboratorName,
  collaboratorLatitude,
  collaboratorLongitude,
  collaboratorUserId
}: CollaboratorRouteMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [collaboratorLocation, setCollaboratorLocation] = useState<[number, number] | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'requesting' | 'denied' | 'granted'>('prompt');

  const mapboxToken = MAPBOX_TOKEN;

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador');
      setPermissionState('denied');
      return;
    }

    setPermissionState('requesting');
    setLoading(true);
    setError(null);

    try {
      // 1. Obter localização do usuário
      const userPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setPermissionState('denied');
              setError('Permita o acesso à sua localização para calcular a rota');
            } else {
              setError('Erro ao obter sua localização');
            }
            reject(error);
          }
        );
      });

      const userLat = userPosition.coords.latitude;
      const userLng = userPosition.coords.longitude;
      setUserLocation([userLng, userLat]);
      setPermissionState('granted');
      console.log('✅ Localização do usuário obtida:', userLat, userLng);

      // 2. Obter coordenadas do colaborador (do banco ou geocodificando)
      let collabLat: number;
      let collabLng: number;

      if (collaboratorLatitude && collaboratorLongitude) {
        console.log('✅ Usando coordenadas do banco:', collaboratorLatitude, collaboratorLongitude);
        collabLat = collaboratorLatitude;
        collabLng = collaboratorLongitude;
      } else {
        console.log('🔄 Geocodificando endereço do colaborador...');
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
          console.error('❌ Erro ao geocodificar:', geoError);
          setError('Não foi possível geocodificar o endereço do colaborador. Verifique se o endereço está completo.');
          setLoading(false);
          return;
        }

        collabLat = geoData.latitude;
        collabLng = geoData.longitude;
        console.log('✅ Endereço geocodificado:', collabLat, collabLng);

        // Salvar coordenadas no banco em background (sem await)
        supabase
          .from('collaborator_profiles')
          .update({
            latitude: collabLat,
            longitude: collabLng
          })
          .eq('user_id', collaboratorUserId)
          .then(({ error }) => {
            if (error) {
              console.error('⚠️ Erro ao salvar coordenadas:', error);
            } else {
              console.log('✅ Coordenadas salvas no banco');
            }
          });
      }

      setCollaboratorLocation([collabLng, collabLat]);

      // 3. Calcular rota usando Mapbox Directions API
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${collabLng},${collabLat}?geometries=geojson&access_token=${mapboxToken}`;
      
      console.log("🔄 Calculando rota com Mapbox Directions API...");
      console.log("📍 URL:", url);
      
      const response = await fetch(url);
      const data = await response.json();

      console.log("📦 Resposta da API Mapbox:", response.status, data);

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Erro desconhecido da API Mapbox';
        console.error("❌ Erro da API Mapbox:", response.status, errorMsg);
        setError(`Não foi possível calcular a rota: ${errorMsg}. Mostrando apenas as localizações no mapa.`);
        // Não retorna aqui - continua para mostrar o mapa sem a rota
      } else if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        console.log("✅ Rota calculada:", route.distance, "m", route.duration, "s");
        setRouteGeometry(route.geometry);
        
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        setRouteInfo({
          distance: `${distanceKm} km`,
          duration: `${durationMin} min`
        });
      } else {
        console.error("❌ Nenhuma rota encontrada na resposta:", data);
        setError('Não foi possível calcular a rota. Mostrando apenas as localizações no mapa.');
      }
    } catch (err: any) {
      console.error('Erro ao calcular rota:', err);
      if (permissionState !== 'denied') {
        setError('Erro ao calcular rota');
      }
    } finally {
      setLoading(false);
    }
  };

  if (permissionState === 'prompt') {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Navigation className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Permissão de Localização Necessária</h3>
            <p className="text-sm text-muted-foreground">
              Para calcular a rota até <span className="font-medium text-foreground">{collaboratorName}</span>, 
              precisamos acessar sua localização atual.
            </p>
            <Button onClick={requestLocation} className="w-full" size="lg">
              <Navigation className="w-4 h-4 mr-2" />
              Permitir Acesso à Localização
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || permissionState === 'requesting') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Calculando rota...</p>
        </div>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold">Permissão de Localização Negada</h3>
            <p className="text-sm text-muted-foreground">
              Para calcular a rota, é necessário permitir o acesso à sua localização nas configurações do navegador.
            </p>
            <Button 
              onClick={() => {
                setPermissionState('prompt');
                setError(null);
              }} 
              variant="outline" 
              className="w-full"
              size="lg"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se tiver erro mas também tiver localização, mostra o mapa com aviso
  if (error && !userLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold">Erro</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => {
                setPermissionState('prompt');
                setError(null);
              }} 
              variant="outline" 
              className="w-full"
              size="lg"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erro ao carregar mapa</AlertDescription>
        </Alert>
      </div>
    );
  }

  try {
    return (
      <div className="relative w-full h-full min-h-[400px]">
        {/* Aviso se houver erro na rota mas o mapa pode ser exibido */}
        {error && userLocation && collaboratorLocation && (
          <Alert className="absolute top-4 right-4 max-w-sm z-10 bg-background/95 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        
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
          mapboxAccessToken={mapboxToken}
          onError={(error) => {
            console.error("CollaboratorRouteMap - Erro do Mapbox:", error);
            setError("Erro ao renderizar o mapa");
          }}
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
  } catch (error) {
    console.error("CollaboratorRouteMap - Erro ao renderizar:", error);
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold">Erro ao Carregar Mapa</h3>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro ao renderizar o mapa. Verifique o console para mais detalhes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
