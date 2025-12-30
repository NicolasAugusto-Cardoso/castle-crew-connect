import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, QrCode, Upload, Check, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBasketModels, useDonationCampaigns, useCreateDonation, useUploadReceipt } from '@/hooks/useDonations';
import { Database } from '@/integrations/supabase/types';

type BasketModel = Database['public']['Tables']['basket_models']['Row'];

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBasket?: BasketModel | null;
}

// PIX data - these would typically come from admin settings
const PIX_KEY = 'contato@castlemovement.org';
const PIX_RECEIVER = 'Castle Movement';

export const DonationDialog = ({ open, onOpenChange, selectedBasket }: DonationDialogProps) => {
  const { user } = useAuth();
  const { data: baskets } = useBasketModels();
  const { data: campaigns } = useDonationCampaigns(true);
  const createDonation = useCreateDonation();
  const uploadReceipt = useUploadReceipt();

  const [step, setStep] = useState<'form' | 'payment' | 'receipt'>('form');
  const [basket, setBasket] = useState<BasketModel | null>(selectedBasket || null);
  const [campaignId, setCampaignId] = useState<string>('');
  const [anonymous, setAnonymous] = useState(false);
  const [donorName, setDonorName] = useState(user?.user_metadata?.name || '');
  const [currentDonationId, setCurrentDonationId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  const activeBaskets = baskets?.filter(b => b.active) || [];

  const handleCreateDonation = async () => {
    if (!basket) {
      toast({
        title: 'Selecione uma cesta',
        description: 'Por favor, selecione o tipo de cesta que deseja doar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const donation = await createDonation.mutateAsync({
        basket_type: basket.type,
        amount: Number(basket.price),
        campaign_id: campaignId || null,
        anonymous,
        donor_name: anonymous ? 'Anônimo' : donorName,
      });

      setCurrentDonationId(donation.id);
      setStep('payment');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    toast({
      title: 'PIX copiado!',
      description: 'Cole no seu aplicativo bancário.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !currentDonationId) return;

    try {
      await uploadReceipt.mutateAsync({
        donationId: currentDonationId,
        file: receiptFile,
      });
      setStep('receipt');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleClose = () => {
    setStep('form');
    setBasket(selectedBasket || null);
    setCampaignId('');
    setAnonymous(false);
    setCurrentDonationId(null);
    setReceiptFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' && 'Fazer uma Doação'}
            {step === 'payment' && 'Pagamento via PIX'}
            {step === 'receipt' && 'Doação Registrada'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form' && 'Escolha o tipo de cesta e como deseja doar.'}
            {step === 'payment' && 'Faça o pagamento via PIX e envie o comprovante.'}
            {step === 'receipt' && 'Sua doação está sendo analisada.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            {/* Basket Selection */}
            <div className="space-y-2">
              <Label>Tipo de Cesta *</Label>
              <Select
                value={basket?.id || ''}
                onValueChange={(value) => {
                  const selected = activeBaskets.find(b => b.id === value);
                  setBasket(selected || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma cesta" />
                </SelectTrigger>
                <SelectContent>
                  {activeBaskets.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title} - R$ {Number(b.price).toFixed(2).replace('.', ',')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Selection */}
            {campaigns && campaigns.length > 0 && (
              <div className="space-y-2">
                <Label>Campanha (opcional)</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Doação geral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Doação geral</SelectItem>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Anonymous Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={anonymous}
                onCheckedChange={(checked) => setAnonymous(checked === true)}
              />
              <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                Doar de forma anônima
              </Label>
            </div>

            {/* Donor Name */}
            {!anonymous && (
              <div className="space-y-2">
                <Label>Seu nome (para transparência)</Label>
                <Input
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Como deseja aparecer"
                />
              </div>
            )}

            {/* Summary */}
            {basket && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor da doação:</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {Number(basket.price).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={handleCreateDonation} 
              className="w-full"
              disabled={!basket || createDonation.isPending}
            >
              {createDonation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Continuar para Pagamento'
              )}
            </Button>
          </div>
        )}

        {step === 'payment' && basket && (
          <div className="space-y-4">
            {/* PIX Info */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                  <QrCode className="w-32 h-32 text-muted-foreground" />
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Valor:</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {Number(basket.price).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Chave PIX (E-mail)</Label>
                  <div className="flex gap-2">
                    <Input value={PIX_KEY} readOnly className="font-mono text-sm" />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyPix}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground text-center">
                  <p>Destinatário: <strong>{PIX_RECEIVER}</strong></p>
                </div>
              </CardContent>
            </Card>

            {/* Upload Receipt */}
            <div className="space-y-2">
              <Label>Comprovante de Pagamento</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Envie uma foto ou PDF do comprovante do PIX
              </p>
            </div>

            <Button 
              onClick={handleUploadReceipt}
              className="w-full"
              disabled={!receiptFile || uploadReceipt.isPending}
            >
              {uploadReceipt.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Comprovante
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'receipt' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Obrigado pela sua doação!</h3>
              <p className="text-muted-foreground text-sm mt-2">
                Seu comprovante foi enviado para análise. Assim que for confirmado, 
                sua doação aparecerá na seção de transparência.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
