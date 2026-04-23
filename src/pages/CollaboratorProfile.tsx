import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, MapPin, CheckCircle2, Pencil, Building2, Briefcase, Calendar, User as UserIcon } from 'lucide-react';
import { EditCollaboratorProfileDialog } from '@/components/collaborator/EditCollaboratorProfileDialog';
import type { CollaboratorProfile } from '@/types/collaborator';

export default function CollaboratorProfilePage() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!hasRole(['collaborator', 'admin'])) {
      navigate('/');
      return;
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('collaborator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data ?? null);

      const { data: prof } = await supabase
        .from('profiles')
        .select('avatar_url, name')
        .eq('id', user.id)
        .maybeSingle();
      setAvatarUrl(prof?.avatar_url ?? null);
      setName(prof?.name ?? user.email?.split('@')[0] ?? 'Colaborador');
    } catch (err: any) {
      toast.error('Erro ao carregar perfil: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasCoords = !!(profile?.latitude && profile?.longitude);
  const fullAddress = profile
    ? [profile.street, profile.street_number, profile.neighborhood, profile.city, profile.state]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>}
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="truncate">{name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  Perfil de Colaborador
                  {hasCoords && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </CardDescription>
                {profile?.accepting_new !== undefined && (
                  <Badge
                    variant={profile.accepting_new ? 'default' : 'secondary'}
                    className="mt-2"
                  >
                    {profile.accepting_new ? 'Aceitando novos discipulados' : 'Não aceitando novos'}
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={() => setEditOpen(true)} className="shrink-0">
              <Pencil className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!profile ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground">Você ainda não preencheu seu perfil de colaborador.</p>
              <Button onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Preencher agora
              </Button>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={Building2} label="Igreja" value={profile.church} />
                <InfoRow icon={Briefcase} label="Cargo" value={profile.position} />
                <InfoRow icon={Calendar} label="Idade" value={profile.age ? `${profile.age} anos` : null} />
              </section>

              {profile.bio && (
                <section>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <UserIcon className="h-4 w-4" />
                    Sobre
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </section>
              )}

              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                {fullAddress ? (
                  <>
                    <p className="text-sm text-muted-foreground">{fullAddress}</p>
                    {profile.postal_code && (
                      <p className="text-sm text-muted-foreground">CEP: {profile.postal_code}</p>
                    )}
                    {hasCoords ? (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                        <CheckCircle2 className="h-3 w-3" /> Endereço geolocalizado
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                        <MapPin className="h-3 w-3" /> Aguardando geolocalização
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Endereço não informado</p>
                )}
              </section>
            </>
          )}
        </CardContent>
      </Card>

      {user && (
        <EditCollaboratorProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          userId={user.id}
          profile={profile}
          currentAvatarUrl={avatarUrl}
          onSaved={loadProfile}
        />
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
      <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium truncate">{value || <span className="italic text-muted-foreground">Não informado</span>}</p>
      </div>
    </div>
  );
}
