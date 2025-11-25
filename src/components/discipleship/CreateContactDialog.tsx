import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";
import { useDiscipleship } from "@/hooks/useDiscipleship";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CreateContactDialog() {
  const { createContact, collaborators } = useDiscipleship();
  const [open, setOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>('auto');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Geocodificar endereço antes de criar o contato
      let latitude = null;
      let longitude = null;

      if (city && neighborhood) {
        setIsGeocoding(true);
        try {
          const { data, error } = await supabase.functions.invoke('geocode-address', {
            body: {
              street,
              streetNumber,
              neighborhood,
              city,
              state,
              postalCode,
            },
          });

          if (!error && data?.latitude && data?.longitude) {
            latitude = data.latitude;
            longitude = data.longitude;
            
            // Mostrar aviso se a localização não for exata
            if (data.accuracy === 'approximate') {
              toast.warning('Localização aproximada', {
                description: 'Não conseguimos localizar o endereço exato. Usamos uma localização aproximada na região.'
              });
            } else if (data.accuracy === 'city') {
              toast.warning('Localização genérica', {
                description: 'Não conseguimos localizar o endereço. Usamos o centro da cidade como referência.'
              });
            }
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          // Continuar mesmo se geocoding falhar
        } finally {
          setIsGeocoding(false);
        }
      }

      await createContact.mutateAsync({
        name,
        phone,
        age: parseInt(age),
        city,
        neighborhood,
        street,
        street_number: streetNumber,
        state,
        postal_code: postalCode,
        latitude,
        longitude,
        assigned_collaborator_id: selectedCollaborator === 'auto' ? null : selectedCollaborator,
      });
      
      // Reset form
      setName('');
      setPhone('');
      setAge('');
      setCity('');
      setNeighborhood('');
      setStreet('');
      setStreetNumber('');
      setState('');
      setPostalCode('');
      setSelectedCollaborator('auto');
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          Cadastrar Nova Pessoa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Pessoa para Discipulado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Escolha um colaborador ou deixe como "Automático" para que o sistema atribua o colaborador mais próximo com base no endereço.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Digite o telefone"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Digite a idade"
                min="0"
                max="150"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Digite a cidade"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Digite o bairro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collaborator">Colaborador</Label>
              <Select 
                value={selectedCollaborator} 
                onValueChange={setSelectedCollaborator}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático (por localização)</SelectItem>
                  {collaborators.map((collab) => (
                    <SelectItem key={collab.user_id} value={collab.user_id}>
                      {collab.name || 'Sem nome'} - {collab.neighborhood || collab.city || 'Sem região'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Rua (opcional)</Label>
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Nome da rua"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="streetNumber">Número (opcional)</Label>
                <Input
                  id="streetNumber"
                  value={streetNumber}
                  onChange={(e) => setStreetNumber(e.target.value)}
                  placeholder="Nº"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">Estado (opcional)</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">CEP (opcional)</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isGeocoding}>
                {isGeocoding ? "Geolocalizando..." : isSubmitting ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}