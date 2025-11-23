import { useEffect, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { MapPin, Loader2, AlertCircle, Navigation, MapPinned, Globe, Home } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { MAPBOX_TOKEN } from '@/config/mapbox';
import { useGeolocation } from '@/hooks/useGeolocation';
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
  const {
    userLocation,
    locationMethod,
    loading: locationLoading,
    error: locationError,
    getLocationByGPS,
    getLocationByIP,
    setLocationManually,
    resetLocation
  } = useGeolocation();

  const [collaboratorLocation, setCollaboratorLocation] = useState<[number, number] | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showMethodSelection, setShowMethodSelection] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  
  // Estados do formulário manual
  const [manualAddress, setManualAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const mapboxToken = MAPBOX_TOKEN;

  // Calcular rota quando tivermos ambas as localizações
  useEffect(() => {
    if (userLocation && collaboratorLocation) {
      calculateRoute();
    }
  }, [userLocation, collaboratorLocation]);

  // Obter coordenadas do colaborador
  useEffect(() => {
    const getCollaboratorLocation = async () => {
      if (collaboratorLatitude && collaboratorLongitude) {
        console.log('✅ Usando coordenadas do colaborador do banco:', collaboratorLatitude, collaboratorLongitude);
        setCollaboratorLocation([collaboratorLongitude, collaboratorLatitude]);
        return;
      }

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
        console.error('❌ Erro ao geocodificar colaborador:', geoError);
        setRouteError('Não foi possível localizar o endereço do colaborador');
        return;
      }

      const collabLat = geoData.latitude;
      const collabLng = geoData.longitude;
      setCollaboratorLocation([collabLng, collabLat]);
      console.log('✅ Colaborador geocodificado:', collabLat, collabLng);

      // Salvar coordenadas em background
      supabase
        .from('collaborator_profiles')
        .update({
          latitude: collabLat,
          longitude: collabLng
        })
        .eq('user_id', collaboratorUserId)
        .then(({ error }) => {
          if (!error) {
            console.log('✅ Coordenadas do colaborador salvas no banco');
          }
        });
    };

    getCollaboratorLocation();
  }, [collaboratorAddress, collaboratorLatitude, collaboratorLongitude, collaboratorUserId]);

  const calculateRoute = async () => {
    if (!userLocation || !collaboratorLocation) return;

    setRouteLoading(true);
    setRouteError(null);

    try {
      const [userLng, userLat] = userLocation;
      const [collabLng, collabLat] = collaboratorLocation;

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${collabLng},${collabLat}?geometries=geojson&access_token=${mapboxToken}`;
      
      console.log("🔄 Calculando rota...");
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.routes || data.routes.length === 0) {
        setRouteError('Não foi possível calcular a rota');
        console.error("❌ Erro ao calcular rota:", data);
        return;
      }

      const route = data.routes[0];
      setRouteGeometry(route.geometry);
      
      const distanceKm = (route.distance / 1000).toFixed(1);
      const durationMin = Math.round(route.duration / 60);
      setRouteInfo({
        distance: `${distanceKm} km`,
        duration: `${durationMin} min`
      });
      
      console.log("✅ Rota calculada:", distanceKm, "km", durationMin, "min");
    } catch (err) {
      console.error('❌ Erro ao calcular rota:', err);
      setRouteError('Erro ao calcular rota');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleGPSClick = async () => {
    setShowMethodSelection(false);
    try {
      await getLocationByGPS();
    } catch (err) {
      // Erro já tratado no hook
      setShowMethodSelection(true);
    }
  };

  const handleIPClick = async () => {
    setShowMethodSelection(false);
    try {
      await getLocationByIP();
    } catch (err) {
      // Se IP falhar, mostrar opções novamente
      setShowMethodSelection(true);
    }
  };

  const handleManualClick = () => {
    setShowMethodSelection(false);
    setShowManualForm(true);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualAddress.street || !manualAddress.city || !manualAddress.state) {
      alert('Preencha pelo menos rua, cidade e estado');
      return;
    }

    setRouteLoading(true);
    setRouteError(null);

    try {
      console.log('🔄 Geocodificando endereço manual...');
      const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-address', {
        body: {
          street: manualAddress.street,
          streetNumber: manualAddress.number,
          neighborhood: manualAddress.neighborhood,
          city: manualAddress.city,
          state: manualAddress.state,
          postalCode: manualAddress.postalCode
        }
      });

      if (geoError || !geoData?.latitude || !geoData?.longitude) {
        console.error('❌ Erro ao geocodificar endereço manual:', geoError);
        setRouteError('Não foi possível localizar o endereço informado. Verifique os dados.');
        setRouteLoading(false);
        return;
      }

      setLocationManually(geoData.latitude, geoData.longitude);
      setShowManualForm(false);
      console.log('✅ Endereço manual geocodificado:', geoData.latitude, geoData.longitude);
    } catch (err) {
      console.error('❌ Erro ao processar endereço manual:', err);
      setRouteError('Erro ao processar endereço');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleTryAgain = () => {
    resetLocation();
    setShowMethodSelection(true);
    setShowManualForm(false);
    setRouteError(null);
  };

  // Renderizar seleção de método
  if (showMethodSelection) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 bg-muted/20">
        <Card className="w-full max-w-[calc(100%-2rem)] sm:max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-base sm:text-lg px-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Navigation className="w-5 h-5 flex-shrink-0" />
                <span className="break-words">Como deseja calcular a rota?</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 break-words px-2">
              Para calcular a rota até <span className="font-medium text-foreground">{collaboratorName}</span>, 
              precisamos saber de onde você está saindo.
            </p>

            <Button 
              onClick={handleGPSClick} 
              className="w-full h-auto py-3 px-3 sm:py-4 sm:px-4 flex flex-col items-start gap-1 text-left"
              variant="default"
              disabled={locationLoading}
            >
              <div className="flex items-center gap-2 w-full">
                <MapPinned className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold break-words text-sm sm:text-base">Localização Precisa (GPS)</span>
              </div>
              <span className="text-[11px] sm:text-xs opacity-90 font-normal text-left break-words">
                Requer permissão do navegador • Mais preciso
              </span>
            </Button>

            <Button 
              onClick={handleIPClick} 
              className="w-full h-auto py-3 px-3 sm:py-4 sm:px-4 flex flex-col items-start gap-1 text-left"
              variant="secondary"
              disabled={locationLoading}
            >
              <div className="flex items-center gap-2 w-full">
                <Globe className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold break-words text-sm sm:text-base">Localização Aproximada (IP)</span>
              </div>
              <span className="text-[11px] sm:text-xs opacity-90 font-normal text-left break-words">
                Baseado na sua conexão • Pode ter diferença de alguns km
              </span>
            </Button>

            <Button 
              onClick={handleManualClick} 
              className="w-full h-auto py-3 px-3 sm:py-4 sm:px-4 flex flex-col items-start gap-1 text-left"
              variant="outline"
              disabled={locationLoading}
            >
              <div className="flex items-center gap-2 w-full">
                <Home className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold break-words text-sm sm:text-base">Digitar Meu Endereço</span>
              </div>
              <span className="text-[11px] sm:text-xs opacity-90 font-normal text-left break-words">
                Informe seu endereço manualmente
              </span>
            </Button>

            {locationError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {locationError === 'GPS negado' 
                    ? 'Permissão GPS negada. Tente usar localização aproximada (IP) ou digite seu endereço.'
                    : locationError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar formulário manual
  if (showManualForm) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 bg-muted/20">
        <Card className="max-w-xl w-full mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Digite Seu Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    value={manualAddress.street}
                    onChange={(e) => setManualAddress({...manualAddress, street: e.target.value})}
                    placeholder="Av. Paulista"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={manualAddress.number}
                    onChange={(e) => setManualAddress({...manualAddress, number: e.target.value})}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={manualAddress.neighborhood}
                  onChange={(e) => setManualAddress({...manualAddress, neighborhood: e.target.value})}
                  placeholder="Centro"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={manualAddress.city}
                    onChange={(e) => setManualAddress({...manualAddress, city: e.target.value})}
                    placeholder="São Paulo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    value={manualAddress.state}
                    onChange={(e) => setManualAddress({...manualAddress, state: e.target.value})}
                    placeholder="SP"
                    maxLength={2}
                    required
                  />
                </div>
              </div>

            <div>
              <Label htmlFor="postalCode">CEP (opcional)</Label>
              <Input
                  id="postalCode"
                  value={manualAddress.postalCode}
                  onChange={(e) => setManualAddress({...manualAddress, postalCode: e.target.value})}
                  placeholder="01310-100"
                />
              </div>

              {routeError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{routeError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleTryAgain} className="flex-1">
                  Voltar
                </Button>
                <Button type="submit" disabled={routeLoading} className="flex-1">
                  {routeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    'Calcular Rota'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading
  if (locationLoading || routeLoading || !collaboratorLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {locationLoading ? 'Obtendo sua localização...' : 'Calculando rota...'}
          </p>
        </div>
      </div>
    );
  }

  // Renderizar mapa se temos ambas as localizações
  if (userLocation && collaboratorLocation) {
    const locationMethodLabel = 
      locationMethod === 'gps' ? 'GPS Preciso' :
      locationMethod === 'ip' ? 'IP Aproximado' :
      locationMethod === 'manual' ? 'Endereço Manual' : '';

    try {
      return (
        <div className="relative w-full h-full min-h-[400px]">
          {/* Avisos */}
          {routeError && (
            <Alert className="absolute top-4 right-4 max-w-sm z-10 bg-background/95 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{routeError}</AlertDescription>
            </Alert>
          )}

          {locationMethod === 'ip' && !routeError && (
            <Alert className="absolute top-4 right-4 max-w-sm z-10 bg-background/95 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Usando localização aproximada (IP). A distância pode variar alguns km.
              </AlertDescription>
            </Alert>
          )}
          
          <Map
            initialViewState={{
              longitude: (userLocation[0] + collaboratorLocation[0]) / 2,
              latitude: (userLocation[1] + collaboratorLocation[1]) / 2,
              zoom: 11
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={mapboxToken}
          >
            {/* Marcador do usuário */}
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
                  Você ({locationMethodLabel})
                </div>
              </div>
            </Marker>

            {/* Marcador do colaborador */}
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

          {/* Botão para trocar método */}
          <Button
            onClick={handleTryAgain}
            variant="outline"
            size="sm"
            className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur-sm"
          >
            Trocar Localização
          </Button>
        </div>
      );
    } catch (error) {
      console.error("Erro ao renderizar mapa:", error);
      return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-muted/20">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <h3 className="text-lg font-semibold">Erro ao Carregar Mapa</h3>
              <Button onClick={handleTryAgain} variant="outline">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Fallback
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar mapa</AlertDescription>
      </Alert>
    </div>
  );
}
