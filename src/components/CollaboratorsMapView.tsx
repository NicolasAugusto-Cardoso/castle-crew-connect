import { useState, useMemo, useEffect, useRef } from 'react';
import Map, { Marker, Popup, MapRef } from 'react-map-gl';
import { MapPin, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { CollaboratorProfile } from '@/types/collaborator';
import { MAPBOX_TOKEN } from '@/config/mapbox';
import { supabase } from '@/integrations/supabase/client';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CollaboratorsMapViewProps {
  collaborators: CollaboratorProfile[];
  userLocation?: { lat: number; lng: number } | null;
}

export function CollaboratorsMapView({ collaborators, userLocation }: CollaboratorsMapViewProps) {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const [selectedCollaborator, setSelectedCollaborator] = useState<CollaboratorProfile | null>(null);
  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });

  // Função para ajustar o mapa ao clicar em um colaborador
  const handleCollaboratorClick = (collaborator: CollaboratorProfile) => {
    setSelectedCollaborator(collaborator);
    
    // Ajustar o mapa para centralizar no colaborador com padding para o card
    if (mapRef.current && collaborator.latitude && collaborator.longitude) {
      mapRef.current.flyTo({
        center: [collaborator.longitude, collaborator.latitude],
        zoom: 15,
        duration: 1000,
        padding: {
          top: 100,
          bottom: 380,
          left: 20,
          right: 20
        }
      });
    }
  };

  // Geocodificar colaboradores sem coordenadas (mesma lógica do CollaboratorMap)
  useEffect(() => {
    const collaboratorsNeedingGeocode = collaborators.filter(c => 
      c.street && c.city && !c.latitude && !c.longitude && !geocodedCoords[c.user_id]
    );
    
    if (collaboratorsNeedingGeocode.length > 0) {
      console.log('🗺️ CollaboratorsMapView - Geocodificando colaboradores:', collaboratorsNeedingGeocode.length);
      setIsGeocoding(true);
      setGeocodingProgress({ current: 0, total: collaboratorsNeedingGeocode.length });
      
      Promise.all(collaboratorsNeedingGeocode.map(async (collab) => {
        try {
          const { data, error } = await supabase.functions.invoke('geocode-address', {
            body: {
              street: collab.street,
              streetNumber: collab.street_number,
              neighborhood: collab.neighborhood,
              city: collab.city,
              state: collab.state,
              postalCode: collab.postal_code,
              country: 'Brasil'
            }
          });

          if (error) throw error;

          if (data?.latitude && data?.longitude) {
            console.log(`📍 Coordenadas obtidas para ${collab.name}:`, { lat: data.latitude, lng: data.longitude });
            
            // Salvar no estado local IMEDIATAMENTE
            setGeocodedCoords(prev => ({
              ...prev,
              [collab.user_id]: { lat: data.latitude, lng: data.longitude }
            }));
            
            setGeocodingProgress(prev => ({ ...prev, current: prev.current + 1 }));
            
            // Salvar no banco em background (sem await para não bloquear)
            supabase
              .from('collaborator_profiles')
              .update({
                latitude: data.latitude,
                longitude: data.longitude
              })
              .eq('user_id', collab.user_id)
              .then(() => console.log(`💾 Coordenadas salvas no banco para ${collab.name}`));
          }
        } catch (error) {
          console.error(`❌ Erro ao geocodificar ${collab.name}:`, error);
        }
      })).finally(() => {
        console.log('✅ Geocodificação concluída');
        setIsGeocoding(false);
      });
    }
  }, [collaborators, geocodedCoords]);

  // Combinar coordenadas do banco + geocodificadas localmente
  const collaboratorsWithCoords = useMemo(() => {
    return collaborators.map(c => {
      const localCoords = geocodedCoords[c.user_id];
      return {
        ...c,
        latitude: c.latitude || localCoords?.lat || null,
        longitude: c.longitude || localCoords?.lng || null
      };
    }).filter(c => c.latitude && c.longitude);
  }, [collaborators, geocodedCoords]);

  // Calcular centro do mapa
  const mapCenter = useMemo(() => {
    if (userLocation) {
      return { longitude: userLocation.lng, latitude: userLocation.lat };
    }

    if (collaboratorsWithCoords.length > 0) {
      const avgLat = collaboratorsWithCoords.reduce((sum, c) => sum + (c.latitude || 0), 0) / collaboratorsWithCoords.length;
      const avgLng = collaboratorsWithCoords.reduce((sum, c) => sum + (c.longitude || 0), 0) / collaboratorsWithCoords.length;
      return { longitude: avgLng, latitude: avgLat };
    }

    // Brasil centro
    return { longitude: -47.9292, latitude: -15.7801 };
  }, [collaboratorsWithCoords, userLocation]);

  if (isGeocoding) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-lg font-semibold mb-2">🗺️ Localizando colaboradores no mapa...</p>
          <p className="text-sm text-muted-foreground">
            Geocodificando {geocodingProgress.current} de {geocodingProgress.total} colaboradores
          </p>
        </div>
      </div>
    );
  }

  if (collaboratorsWithCoords.length === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhum colaborador com localização disponível
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border shadow-lg">
      <Map
        ref={mapRef}
        initialViewState={{
          ...mapCenter,
          zoom: userLocation ? 12 : (collaboratorsWithCoords.length > 0 ? 13 : 5)
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* Marcador do usuário */}
        {userLocation && (
          <Marker 
            longitude={userLocation.lng} 
            latitude={userLocation.lat} 
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

        {/* Marcadores dos colaboradores */}
        {collaboratorsWithCoords.map((collaborator) => {
          const initials = collaborator.name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '??';

          return (
            <Marker
              key={collaborator.id}
              longitude={collaborator.longitude!}
              latitude={collaborator.latitude!}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleCollaboratorClick(collaborator);
              }}
            >
              <div className="cursor-pointer transform hover:scale-110 transition-transform">
                <div className="bg-primary rounded-full p-2 shadow-lg border-2 border-background">
                  <MapPin className="w-5 h-5 text-primary-foreground" fill="currentColor" />
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Popup do colaborador selecionado */}
        {selectedCollaborator && (
          <Popup
            longitude={selectedCollaborator.longitude!}
            latitude={selectedCollaborator.latitude!}
            anchor="bottom"
            onClose={() => setSelectedCollaborator(null)}
            closeButton={true}
            closeOnClick={false}
            offset={25}
            className="collaborator-popup"
          >
            <div className="p-4 min-w-[250px]">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                  <AvatarImage 
                    src={selectedCollaborator.avatar_url || ''} 
                    alt={selectedCollaborator.name || 'Colaborador'}
                  />
                  <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                    {selectedCollaborator.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    {selectedCollaborator.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    {selectedCollaborator.age} anos
                  </p>
                  {selectedCollaborator.church && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {selectedCollaborator.church}
                    </p>
                  )}
                </div>
              </div>

              {selectedCollaborator.accepting_new && (
                <div className="mb-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                  Aceitando novos
                </div>
              )}

              {selectedCollaborator.bio && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {selectedCollaborator.bio}
                </p>
              )}

              <Button 
                onClick={() => navigate(`/colaboradores/${selectedCollaborator.user_id}`)}
                className="w-full"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver detalhes
              </Button>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-full p-1">
              <MapPin className="w-3 h-3 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-xs text-muted-foreground">
              Colaboradores ({collaboratorsWithCoords.length})
            </span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 rounded-full p-1">
                <MapPin className="w-3 h-3 text-white" fill="white" />
              </div>
              <span className="text-xs text-muted-foreground">Você</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
