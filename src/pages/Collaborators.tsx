import { useState, useEffect, useMemo } from 'react';
import { useCollaborators } from '@/hooks/useCollaborators';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Church, Eye, Navigation, ArrowUpDown, Map as MapIcon, Grid3x3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { RouteDialog } from '@/components/RouteDialog';
import { CollaboratorsMapView } from '@/components/CollaboratorsMapView';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollaboratorProfile } from '@/types/collaborator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Função para calcular distância entre dois pontos (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

type CollaboratorWithDistance = CollaboratorProfile & { distance?: number };

export default function Collaborators() {
  const { data: collaborators, isLoading } = useCollaborators();
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState<{
    address: {
      street: string;
      streetNumber: string;
      neighborhood: string;
      city: string;
      state: string;
      postalCode: string;
    };
    name: string;
    userId: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'distance'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Obter localização do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Localização não disponível:', error);
        }
      );
    }
  }, []);

  // Calcular distâncias e ordenar colaboradores
  const sortedCollaborators = useMemo<CollaboratorWithDistance[]>(() => {
    if (!collaborators) return [];

    const collabsWithDistance: CollaboratorWithDistance[] = collaborators.map(collab => {
      if (userLocation && collab.latitude && collab.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          collab.latitude,
          collab.longitude
        );
        return { ...collab, distance };
      }
      return collab;
    });

    if (sortBy === 'distance' && userLocation) {
      // Ordenar por distância (colaboradores sem coordenadas vão para o final)
      return [...collabsWithDistance].sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return collabsWithDistance;
  }, [collaborators, userLocation, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sortedCollaborators || sortedCollaborators.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Church className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Nenhum colaborador disponível</h2>
            <p className="text-muted-foreground">
              Ainda não há colaboradores com perfis completos cadastrados no sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Colaboradores</h1>
          <p className="text-muted-foreground text-lg">
            Conheça nossos colaboradores disponíveis para discipulado
          </p>
        </div>

        {/* Tabs de visualização */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'map')} className="w-full">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <Grid3x3 className="w-4 h-4" />
                Grade
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <MapIcon className="w-4 h-4" />
                Mapa
              </TabsTrigger>
            </TabsList>

            {/* Filtros - apenas na visualização de grade */}
            {viewMode === 'grid' && (
              <div className="flex items-center gap-3">
                <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value: 'default' | 'distance') => setSortBy(value)}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão (por cidade)</SelectItem>
                    <SelectItem value="distance" disabled={!userLocation}>
                      Por distância {!userLocation && '(localização desativada)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {sortBy === 'distance' && userLocation && (
                  <span className="text-sm text-muted-foreground">
                    Mostrando do mais próximo ao mais distante
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Visualização em Grade */}
          <TabsContent value="grid" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {sortedCollaborators.map((collaborator) => {
            const initials = collaborator.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '??';

            const location = collaborator.neighborhood && collaborator.city
              ? `${collaborator.neighborhood}, ${collaborator.city}`
              : `${collaborator.city}, ${collaborator.state}`;

            return (
              <Card 
                key={collaborator.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-16 w-16 shrink-0 ring-2 ring-primary/10">
                      <AvatarImage 
                        src={collaborator.avatar_url || ''} 
                        alt={collaborator.name || 'Colaborador'}
                      />
                      <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1 truncate">
                        {collaborator.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {collaborator.age} anos
                      </p>

                      {/* Localização */}
                      <div className="flex items-start gap-2 mb-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        <div className="flex-1">
                          <span className="text-muted-foreground line-clamp-2">
                            {location}
                          </span>
                          {collaborator.distance !== undefined && (
                            <span className="block text-xs text-primary font-medium mt-0.5">
                              {collaborator.distance < 1 
                                ? `${(collaborator.distance * 1000).toFixed(0)}m de você`
                                : `${collaborator.distance.toFixed(1)}km de você`
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Igreja */}
                      <div className="flex items-start gap-2 text-sm">
                        <Church className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        <span className="text-muted-foreground line-clamp-2">
                          {collaborator.church}
                        </span>
                      </div>

                      {/* Badge de disponibilidade */}
                      {collaborator.accepting_new && (
                        <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                          Aceitando novos discipulados
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio - resumo */}
                  {collaborator.bio && (
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                      {collaborator.bio}
                    </p>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => navigate(`/colaboradores/${collaborator.user_id}`)}
                      className="flex-1"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalhes
                    </Button>
                    
                    {collaborator.street && collaborator.city && (
                      <Button 
                        onClick={() => setSelectedRoute({
                          address: {
                            street: collaborator.street!,
                            streetNumber: collaborator.street_number || '',
                            neighborhood: collaborator.neighborhood || '',
                            city: collaborator.city!,
                            state: collaborator.state || '',
                            postalCode: collaborator.postal_code || ''
                          },
                          name: collaborator.name!,
                          userId: collaborator.user_id,
                          latitude: collaborator.latitude,
                          longitude: collaborator.longitude
                        })}
                        variant="outline"
                        size="icon"
                        title="Ver trajeto"
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
            </div>
          </TabsContent>

          {/* Visualização em Mapa */}
          <TabsContent value="map" className="mt-0">
            <CollaboratorsMapView 
              collaborators={sortedCollaborators}
              userLocation={userLocation}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Rota */}
      {selectedRoute && (
        <RouteDialog
          open={!!selectedRoute}
          onOpenChange={(open) => !open && setSelectedRoute(null)}
          collaboratorAddress={selectedRoute.address}
          collaboratorName={selectedRoute.name}
          collaboratorUserId={selectedRoute.userId}
          collaboratorLatitude={selectedRoute.latitude}
          collaboratorLongitude={selectedRoute.longitude}
        />
      )}
    </div>
  );
}
