import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useStickyState } from '@/hooks/useStickyState';
import type { CollaboratorProfile, CollaboratorProfileForm } from '@/types/collaborator';

interface EditCollaboratorProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  profile: CollaboratorProfile | null;
  currentAvatarUrl: string | null;
  onSaved: () => void;
}

const emptyForm: CollaboratorProfileForm = {
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
};

function buildAddressKey(f: CollaboratorProfileForm) {
  return [f.street, f.street_number, f.neighborhood, f.city, f.state, f.postal_code].join('|');
}

/**
 * Extrai o caminho dentro do bucket "avatars" a partir de uma URL pública.
 * Ex.: https://xxx.supabase.co/storage/v1/object/public/avatars/<userId>/123.jpg
 *      → "<userId>/123.jpg"
 */
function extractAvatarStoragePath(publicUrl: string | null): string | null {
  if (!publicUrl) return null;
  const marker = '/storage/v1/object/public/avatars/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
}

export function EditCollaboratorProfileDialog({
  open,
  onOpenChange,
  userId,
  profile,
  currentAvatarUrl,
  onSaved,
}: EditCollaboratorProfileDialogProps) {
  // Persistência por usuário — sobrevive a troca de aba e refresh
  const stickyKey = `collab-profile-edit:${userId}`;
  const [formData, setFormData, clearForm] = useStickyState<CollaboratorProfileForm>(stickyKey, emptyForm);
  const [isOpenSticky, setIsOpenSticky, clearOpen] = useStickyState<boolean>(`${stickyKey}:open`, false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hidrata o form com os dados do perfil quando abre pela primeira vez
  // (mas respeita rascunhos salvos no sticky storage).
  useEffect(() => {
    if (!open || hydrated) return;
    const hasDraft = formData && (formData.church || formData.city || formData.bio || formData.age);
    if (!hasDraft && profile) {
      setFormData({
        church: profile.church || '',
        position: profile.position || '',
        bio: profile.bio || '',
        street: profile.street || '',
        street_number: profile.street_number || '',
        neighborhood: profile.neighborhood || '',
        city: profile.city || '',
        state: profile.state || '',
        postal_code: profile.postal_code || '',
        accepting_new: profile.accepting_new ?? true,
        age: profile.age != null ? String(profile.age) : '',
      });
    }
    setAvatarPreview(currentAvatarUrl);
    setHydrated(true);
  }, [open, hydrated, profile, currentAvatarUrl, formData, setFormData]);

  // Sincroniza o estado externo com o sticky de "modal aberto"
  useEffect(() => {
    if (isOpenSticky && !open) {
      onOpenChange(true);
    }
  }, [isOpenSticky, open, onOpenChange]);

  useEffect(() => {
    setIsOpenSticky(open);
  }, [open, setIsOpenSticky]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas imagens');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string> => {
    if (!avatarFile) throw new Error('Nenhum arquivo selecionado');
    setUploading(true);
    try {
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Exclui o avatar antigo de forma rigorosa: se a chamada falhar OU
   * o objeto ainda existir após a tentativa, lança erro explícito.
   */
  const deleteOldAvatar = async (oldUrl: string | null) => {
    const path = extractAvatarStoragePath(oldUrl);
    if (!path) return; // nada a apagar
    const { data, error } = await supabase.storage.from('avatars').remove([path]);
    if (error) {
      throw new Error(`Falha ao excluir avatar antigo: ${error.message}`);
    }
    // Storage retorna a lista de objetos efetivamente removidos.
    // Se vier vazia, o arquivo não foi removido.
    if (!data || data.length === 0) {
      throw new Error('A imagem antiga não foi removida do armazenamento.');
    }
  };

  const geocodeAddress = async () => {
    if (!formData.city || !formData.neighborhood) return null;
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
      if (data?.latitude && data?.longitude) {
        return { latitude: data.latitude, longitude: data.longitude };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validação de idade
      const ageStr = formData.age.trim();
      if (!ageStr) {
        toast.error('Idade é obrigatória');
        setSaving(false);
        return;
      }
      const ageNum = parseInt(ageStr, 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
        toast.error('Idade deve estar entre 18 e 120');
        setSaving(false);
        return;
      }

      // 1. Upload do novo avatar (se houver)
      let newAvatarUrl: string | null = null;
      if (avatarFile) {
        try {
          newAvatarUrl = await uploadAvatar();
        } catch (err: any) {
          toast.error('Erro ao enviar foto: ' + err.message);
          setSaving(false);
          return;
        }
      }

      // 2. Geocodificação se o endereço mudou
      const oldAddressKey = profile
        ? [profile.street, profile.street_number, profile.neighborhood, profile.city, profile.state, profile.postal_code].join('|')
        : '';
      const addressChanged = oldAddressKey !== buildAddressKey(formData);
      let coords: { latitude: number; longitude: number } | null = null;
      if (addressChanged || !profile?.latitude || !profile?.longitude) {
        coords = await geocodeAddress();
      } else {
        coords = { latitude: profile.latitude, longitude: profile.longitude };
      }

      // 3. Atualizar avatar no profiles (e remover antigo de forma rigorosa)
      if (newAvatarUrl) {
        const { error: profErr } = await supabase
          .from('profiles')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', userId);
        if (profErr) throw profErr;

        // Exclusão rigorosa do avatar antigo (não silencia falhas)
        try {
          await deleteOldAvatar(currentAvatarUrl);
        } catch (delErr: any) {
          // Não reverte o upload, mas avisa o usuário explicitamente.
          toast.error(delErr.message || 'Não foi possível remover a foto anterior');
        }
      }

      // 4. Salvar/atualizar collaborator_profiles
      const payload = {
        user_id: userId,
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
        age: ageNum,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };

      if (profile) {
        const { error } = await supabase
          .from('collaborator_profiles')
          .update(payload)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('collaborator_profiles').insert(payload);
        if (error) throw error;
      }

      toast.success('Perfil atualizado com sucesso!');
      // Limpa rascunho persistido e fecha
      clearForm();
      clearOpen();
      setAvatarFile(null);
      setHydrated(false);
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error('Erro ao salvar perfil: ' + (err.message || 'desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    clearForm();
    clearOpen();
    setAvatarFile(null);
    setAvatarPreview(currentAvatarUrl);
    setHydrated(false);
    onOpenChange(false);
  };

  const busy = saving || uploading || geocoding;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleCancel() : onOpenChange(o))}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações de colaborador. As alterações serão salvas mesmo se você trocar de aba.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <Avatar className="w-20 h-20">
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt="Avatar" />
              ) : (
                <AvatarFallback>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar-edit">Foto de perfil</Label>
              <Input
                id="avatar-edit"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={busy}
                className="mt-1 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP — máx 2MB</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="church-edit">Igreja *</Label>
            <Input
              id="church-edit"
              value={formData.church}
              onChange={(e) => setFormData({ ...formData, church: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position-edit">Cargo</Label>
              <Input
                id="position-edit"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Pastor, Líder"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age-edit">Idade *</Label>
              <Input
                id="age-edit"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.age}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || /^\d+$/.test(v)) setFormData({ ...formData, age: v });
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio-edit">Sobre você</Label>
            <Textarea
              id="bio-edit"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t space-y-4">
            <h3 className="text-sm font-semibold">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street-edit">Rua</Label>
                <Input
                  id="street-edit"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number-edit">Número</Label>
                <Input
                  id="number-edit"
                  value={formData.street_number}
                  onChange={(e) => setFormData({ ...formData, street_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neigh-edit">Bairro *</Label>
                <Input
                  id="neigh-edit"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city-edit">Cidade *</Label>
                <Input
                  id="city-edit"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state-edit">UF</Label>
                <Input
                  id="state-edit"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep-edit">CEP</Label>
                <Input
                  id="cep-edit"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox
              id="accepting-edit"
              checked={formData.accepting_new}
              onCheckedChange={(c) => setFormData({ ...formData, accepting_new: c === true })}
            />
            <Label htmlFor="accepting-edit" className="cursor-pointer">
              Aceitar novos discipulados
            </Label>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando foto...</>
              ) : geocoding ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Geolocalizando...</>
              ) : saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
