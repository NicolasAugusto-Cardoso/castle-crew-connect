import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Church, User, Calendar, ArrowLeft, MessageCircle } from 'lucide-react';
import { CollaboratorProfile } from '@/types/collaborator';

export default function CollaboratorDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: collaborator, isLoading } = useQuery({
    queryKey: ['collaborator-details', userId],
    queryFn: async () => {
      // Buscar perfil do colaborador
      const { data: collabData, error: collabError } = await supabase
        .from('collaborator_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (collabError) throw collabError;

      // Buscar dados do perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      return {
        id: collabData.id,
        user_id: collabData.user_id,
        church: collabData.church,
        position: collabData.position,
        bio: collabData.bio,
        city: collabData.city,
        state: collabData.state,
        neighborhood: collabData.neighborhood,
        age: collabData.age,
        accepting_new: collabData.accepting_new,
        name: profileData.name,
        avatar_url: profileData.avatar_url,
      } as CollaboratorProfile;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!collaborator) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Colaborador não encontrado</p>
            <Button onClick={() => navigate('/colaboradores')} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = collaborator.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  const location = [collaborator.neighborhood, collaborator.city, collaborator.state]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate('/colaboradores')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Card Principal */}
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar Grande */}
              <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl">
                <AvatarImage 
                  src={collaborator.avatar_url || ''} 
                  alt={collaborator.name || 'Colaborador'}
                />
                <AvatarFallback className="text-3xl font-bold bg-primary/20 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info Principal */}
              <div className="flex-1 text-center md:text-left">
                <CardTitle className="text-3xl mb-2">
                  {collaborator.name}
                </CardTitle>
                {collaborator.position && (
                  <p className="text-lg text-muted-foreground mb-3">
                    {collaborator.position}
                  </p>
                )}
                {collaborator.accepting_new && (
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                    ✓ Aceitando novos discipulados
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Seção: Informações Pessoais */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collaborator.age && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{collaborator.age} anos</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Seção: Igreja */}
            {collaborator.church && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Church className="w-5 h-5 text-primary" />
                  Igreja
                </h3>
                <p className="text-muted-foreground">{collaborator.church}</p>
              </div>
            )}

            {/* Seção: Sobre */}
            {collaborator.bio && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Sobre</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {collaborator.bio}
                </p>
              </div>
            )}

            {/* Botão Entrar em Contato */}
            <div className="pt-4">
              <Button 
                onClick={() => navigate(`/colaboradores/${collaborator.user_id}/chat`)}
                className="w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Entrar em contato
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
