import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Save, 
  CreditCard, 
  History, 
  AlertCircle,
  Check,
  Upload,
  Image
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  usePaymentSettings, 
  usePaymentAuditLogs, 
  useManagePaymentSettings,
  PaymentSettings 
} from '@/hooks/useDonations';

type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

const PIX_KEY_LABELS: Record<PixKeyType, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave Aleatória',
};

// Validation functions
const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;

  return true;
};

const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleaned.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleaned.charAt(13))) return false;

  return true;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  // E.164 format: +55XXXXXXXXXXX (13 digits for Brazil)
  return /^55\d{10,11}$/.test(cleaned) || /^\d{10,11}$/.test(cleaned);
};

const validateRandomKey = (key: string): boolean => {
  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
};

const validatePixKey = (key: string, type: PixKeyType): { valid: boolean; message: string } => {
  switch (type) {
    case 'cpf':
      return {
        valid: validateCPF(key),
        message: 'CPF inválido. Deve ter 11 dígitos numéricos válidos.',
      };
    case 'cnpj':
      return {
        valid: validateCNPJ(key),
        message: 'CNPJ inválido. Deve ter 14 dígitos numéricos válidos.',
      };
    case 'email':
      return {
        valid: validateEmail(key),
        message: 'E-mail inválido. Formato: exemplo@dominio.com',
      };
    case 'phone':
      return {
        valid: validatePhone(key),
        message: 'Telefone inválido. Use formato: +55XXXXXXXXXXX ou apenas números.',
      };
    case 'random':
      return {
        valid: validateRandomKey(key),
        message: 'Chave aleatória inválida. Deve ser um UUID v4 válido.',
      };
    default:
      return { valid: false, message: 'Tipo de chave inválido.' };
  }
};

interface PaymentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentSettingsDialog = ({ open, onOpenChange }: PaymentSettingsDialogProps) => {
  const { data: settings, isLoading: loadingSettings } = usePaymentSettings();
  const { data: auditLogs, isLoading: loadingAudit } = usePaymentAuditLogs();
  const manageSettings = useManagePaymentSettings();

  const [receiverName, setReceiverName] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('email');
  const [description, setDescription] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current settings when dialog opens
  useEffect(() => {
    if (settings) {
      setReceiverName(settings.receiver_name || '');
      setPixKey(settings.pix_key || '');
      setPixKeyType((settings.pix_key_type as PixKeyType) || 'email');
      setDescription(settings.description || '');
      setQrCodeUrl(settings.qr_code_url || '');
      setIsActive(settings.is_active ?? true);
      setHasChanges(false);
      setValidationError(null);
    }
  }, [settings]);

  const handleFieldChange = () => {
    setHasChanges(true);
    setValidationError(null);
  };

  const handleSave = async () => {
    // Validate PIX key
    const validation = validatePixKey(pixKey, pixKeyType);
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }

    if (!receiverName.trim()) {
      setValidationError('Nome do recebedor é obrigatório.');
      return;
    }

    await manageSettings.mutateAsync({
      id: settings?.id,
      receiver_name: receiverName.trim(),
      pix_key: pixKey.trim(),
      pix_key_type: pixKeyType,
      description: description.trim() || null,
      qr_code_url: qrCodeUrl.trim() || null,
      is_active: isActive,
    });

    setHasChanges(false);
    setValidationError(null);
  };

  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we'll create a local URL - in production this would upload to storage
    const reader = new FileReader();
    reader.onload = (event) => {
      setQrCodeUrl(event.target?.result as string);
      handleFieldChange();
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Configurações de Pagamento
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Dados PIX</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 mt-4">
            {loadingSettings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <>
                {/* Current Status */}
                <Card className={isActive ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-sm font-medium">
                          {isActive ? 'Pagamentos ativos' : 'Pagamentos desativados'}
                        </span>
                      </div>
                      <Switch checked={isActive} onCheckedChange={(checked) => { setIsActive(checked); handleFieldChange(); }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Validation Error */}
                {validationError && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{validationError}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Form Fields */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Recebedor *</Label>
                    <Input
                      value={receiverName}
                      onChange={(e) => { setReceiverName(e.target.value); handleFieldChange(); }}
                      placeholder="Ex: Castle Movement"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo da Chave PIX *</Label>
                      <Select 
                        value={pixKeyType} 
                        onValueChange={(v) => { setPixKeyType(v as PixKeyType); handleFieldChange(); }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PIX_KEY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Chave PIX *</Label>
                      <Input
                        value={pixKey}
                        onChange={(e) => { setPixKey(e.target.value); handleFieldChange(); }}
                        placeholder={
                          pixKeyType === 'cpf' ? '000.000.000-00' :
                          pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                          pixKeyType === 'email' ? 'email@exemplo.com' :
                          pixKeyType === 'phone' ? '+5511999999999' :
                          'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx'
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição do Pagamento</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); handleFieldChange(); }}
                      placeholder="Ex: Doação para o Castle Movement"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>QR Code PIX</Label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleQrCodeUpload}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Faça upload de uma imagem do QR Code PIX
                        </p>
                      </div>
                      {qrCodeUrl && (
                        <div className="w-24 h-24 border rounded-lg overflow-hidden bg-white flex items-center justify-center">
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code PIX" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSave} 
                  className="w-full"
                  disabled={!hasChanges || manageSettings.isPending || !receiverName || !pixKey}
                >
                  {manageSettings.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ Alterações afetam somente doações futuras
                </p>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Histórico de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAudit ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : auditLogs?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma alteração registrada
                  </p>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {auditLogs?.map((log) => (
                        <div key={log.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">
                              {format(new Date(log.created_at || ''), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="font-medium text-muted-foreground">Antes:</p>
                              <pre className="whitespace-pre-wrap break-all bg-background p-2 rounded mt-1">
                                {log.old_data ? JSON.stringify(log.old_data, null, 2) : 'N/A'}
                              </pre>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Depois:</p>
                              <pre className="whitespace-pre-wrap break-all bg-background p-2 rounded mt-1">
                                {log.new_data ? JSON.stringify(log.new_data, null, 2) : 'N/A'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
