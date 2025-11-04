import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import type { CollaboratorProfile, CollaboratorProfileForm } from '@/types/collaborator';

export default function CollaboratorProfile() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [formData, setFormData] = useState<CollaboratorProfileForm>({
    church: '',
    position: '',
    bio: '',
    street: '',
    street_number: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
    accepting_new: true,
  });

  useEffect(() => {
    if (!hasRole(['collaborator', 'admin'])) {
      navigate('/');
      return;
    }
    loadProfile();
  }, [user, hasRole, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('collaborator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setFormData({
          church: data.church || '',
          position: data.position || '',
          bio: data.bio || '',
          street: data.street || '',
          street_number: data.street_number || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          accepting_new: data.accepting_new ?? true,
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async () => {
    if (!formData.city || !formData.neighborhood) {
      toast.error('Preencha pelo menos cidade e bairro para geolocalização');
      return null;
    }

    setGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: {
          street: formData.street,
          streetNumber: formData.street_number,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postal_code,
        },
      });

      if (error) throw error;

      if (data.latitude && data.longitude) {
        toast.success('Endereço geolocalizado com sucesso!');
        return { latitude: data.latitude, longitude: data.longitude };
      } else {
        toast.warning('Não foi possível geolocalizar o endereço exato');
        return null;
      }
    } catch (error: any) {
      console.error('Geocoding error:', error);
      toast.error('Erro ao geolocalizar endereço');
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Geocodificar endereço
      const coordinates = await geocodeAddress();

      const profileData = {
        user_id: user.id,
        ...formData,
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (profile) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from('collaborator_profiles')
          .update(profileData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Criar novo perfil
        const { error } = await supabase
          .from('collaborator_profiles')
          .insert(profileData);

        if (error) throw error;
      }

      toast.success('Perfil salvo com sucesso!');
      loadProfile();
    } catch (error: any) {
      toast.error('Erro ao salvar perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasValidCoordinates = profile?.latitude && profile?.longitude;

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Meu Perfil de Colaborador
            {hasValidCoordinates && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
          </CardTitle>
          <CardDescription>
            Mantenha seus dados atualizados para receber atribuições de discipulados próximos
          </CardDescription>
          {hasValidCoordinates && (
            <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
              <MapPin className="h-4 w-4" />
              Endereço geolocalizado
            </div>
          )}
          {!hasValidCoordinates && formData.city && (
            <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
              <MapPin className="h-4 w-4" />
              Aguardando geolocalização
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Igreja e Cargo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="church">Igreja</Label>
                <Input
                  id="church"
                  value={formData.church}
                  onChange={(e) => setFormData({ ...formData, church: e.target.value })}
                  placeholder="Nome da igreja"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ex: Pastor, Líder, etc"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Sobre você</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Descreva um pouco sobre você e seu ministério"
                rows={3}
              />
            </div>

            {/* Endereço - Título */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Endereço (para atribuição de discipulados)</h3>
              
              {/* Rua e Número */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Nome da rua"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street_number">Número</Label>
                  <Input
                    id="street_number"
                    value={formData.street_number}
                    onChange={(e) => setFormData({ ...formData, street_number: e.target.value })}
                    placeholder="Nº"
                  />
                </div>
              </div>

              {/* Bairro, Cidade, Estado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* CEP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">CEP</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Disponibilidade */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                id="accepting_new"
                checked={formData.accepting_new}
                onCheckedChange={(checked) => setFormData({ ...formData, accepting_new: checked })}
              />
              <Label htmlFor="accepting_new" className="cursor-pointer">
                Aceitar novos discipulados
              </Label>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/discipleship')}
                disabled={saving || geocoding}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || geocoding}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : geocoding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Geolocalizando...
                  </>
                ) : (
                  'Salvar Perfil'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}