import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, MapPin, CheckCircle2, Upload } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { CollaboratorProfile, CollaboratorProfileForm } from '@/types/collaborator';

export default function CollaboratorProfile() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [previousAddress, setPreviousAddress] = useState<string>('');
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
    age: '',
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!hasRole(['collaborator', 'admin'])) {
      navigate('/');
      return;
    }
    loadProfile();
  }, [user, hasRole, navigate, authLoading]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('collaborator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Buscar avatar do usuário
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (userError) console.error('Erro ao carregar avatar:', userError);

      if (data) {
        setProfile(data);
        const addressString = [
          data.street || '',
          data.street_number || '',
          data.neighborhood || '',
          data.city || '',
          data.state || '',
          data.postal_code || ''
        ].join('|');
        setPreviousAddress(addressString);
        
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
          age: data.age !== null && data.age !== undefined ? data.age.toString() : '',
        });
      }

      // Carregar preview do avatar atual
      if (userData?.avatar_url) {
        setAvatarPreview(userData.avatar_url);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar perfil: ' + error.message);
    } finally {
      setProfileLoading(false);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens');
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setAvatarFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    setUploading(true);
    try {
      // Gerar nome único para o arquivo
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload da foto: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // 1. Upload de avatar (se houver)
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
        if (!avatarUrl) {
          setSaving(false);
          return;
        }
      }

      // 2. Verificar se o endereço mudou
      const currentAddress = [
        formData.street,
        formData.street_number,
        formData.neighborhood,
        formData.city,
        formData.state,
        formData.postal_code
      ].join('|');
      
      const addressChanged = currentAddress !== previousAddress;
      
      // 3. Geocodificar apenas se o endereço mudou ou se não tem coordenadas
      let coordinates = null;
      if (addressChanged || !profile?.latitude || !profile?.longitude) {
        console.log('🗺️ CollaboratorProfile - Endereço mudou ou sem coordenadas, geocodificando...');
        coordinates = await geocodeAddress();
        if (coordinates) {
          console.log('📍 CollaboratorProfile - Coordenadas obtidas:', coordinates);
        }
      } else {
        console.log('✅ CollaboratorProfile - Usando coordenadas existentes');
        coordinates = { latitude: profile.latitude, longitude: profile.longitude };
      }

      // 4. Validar e converter idade
      const ageValue = formData.age.trim();
      if (ageValue === '') {
        toast.error('Idade é obrigatória');
        setSaving(false);
        return;
      }

      const ageNumber = parseInt(ageValue, 10);
      if (isNaN(ageNumber) || ageNumber < 18 || ageNumber > 120) {
        toast.error('Idade deve ser um número entre 18 e 120');
        setSaving(false);
        return;
      }

      // 5. Atualizar avatar no profiles (se fez upload)
      if (avatarUrl) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // 6. Salvar dados do colaborador
      const profileData = {
        user_id: user.id,
        church: formData.church,
        position: formData.position,
        bio: formData.bio,
        street: formData.street,
        street_number: formData.street_number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        accepting_new: formData.accepting_new,
        age: ageNumber,
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (profile) {
        const { error } = await supabase
          .from('collaborator_profiles')
          .update(profileData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('collaborator_profiles')
          .insert(profileData);

        if (error) throw error;
      }

      toast.success('Perfil salvo com sucesso!');
      setAvatarFile(null);
      loadProfile();
    } catch (error: any) {
      toast.error('Erro ao salvar perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profileLoading) {
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
            {/* Avatar */}
            <div className="space-y-4 pb-6 border-b">
              <Label>Foto de Perfil *</Label>
              <div className="flex items-center gap-6">
                {/* Preview do Avatar */}
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt="Preview" />
                    ) : (
                      <AvatarFallback>
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                
                {/* Input de Upload */}
                <div className="flex-1">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading || saving}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG ou WEBP. Máximo 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Igreja */}
            <div className="space-y-2">
              <Label htmlFor="church">Igreja *</Label>
              <Input
                id="church"
                value={formData.church}
                onChange={(e) => setFormData({ ...formData, church: e.target.value })}
                placeholder="Nome da igreja"
                required
              />
            </div>

            {/* Cargo e Idade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ex: Pastor, Líder, etc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Idade *</Label>
                <Input
                  id="age"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.age}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir apenas números e campo vazio
                    if (value === '' || /^\d+$/.test(value)) {
                      setFormData({ ...formData, age: value });
                    }
                  }}
                  placeholder="Ex: 30"
                  required
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
              <Checkbox
                id="accepting_new"
                checked={formData.accepting_new}
                onCheckedChange={(checked) => setFormData({ ...formData, accepting_new: checked === true })}
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
                disabled={saving || geocoding || uploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || geocoding || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fazendo upload...
                  </>
                ) : saving ? (
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