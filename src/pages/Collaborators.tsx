import { useState } from 'react';
import { useCollaborators } from '@/hooks/useCollaborators';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Church, Eye, Navigation } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { RouteDialog } from '@/components/RouteDialog';

export default function Collaborators() {
  const { data: collaborators, isLoading } = useCollaborators();
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);

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

  if (!collaborators || collaborators.length === 0) {
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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Colaboradores</h1>
          <p className="text-muted-foreground text-lg">
            Conheça nossos colaboradores disponíveis para discipulado
          </p>
        </div>

        {/* Grid de Colaboradores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {collaborators.map((collaborator) => {
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
                        <span className="text-muted-foreground line-clamp-2">
                          {location}
                        </span>
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
                    
                    {collaborator.latitude && collaborator.longitude && (
                      <Button 
                        onClick={() => setSelectedRoute({
                          lat: collaborator.latitude!,
                          lng: collaborator.longitude!,
                          name: collaborator.name!
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
      </div>

      {/* Dialog de Rota */}
      {selectedRoute && (
        <RouteDialog
          open={!!selectedRoute}
          onOpenChange={(open) => !open && setSelectedRoute(null)}
          collaboratorLat={selectedRoute.lat}
          collaboratorLng={selectedRoute.lng}
          collaboratorName={selectedRoute.name}
        />
      )}
    </div>
  );
}
