import { useState } from 'react';
import { Copy, CheckCircle, Upload, QrCode, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { 
  useCreateDonation, 
  useUploadReceipt,
  BasketModel, 
  DonationCampaign,
  Donation
} from '@/hooks/useDonations';

interface DonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basket: BasketModel | null;
  campaign: DonationCampaign | null;
}

// PIX Info - Configure aqui
const PIX_KEY = 'castlemovement@email.com'; // Chave PIX do projeto
const PIX_NAME = 'Castle Movement';

export function DonateDialog({ open, onOpenChange, basket, campaign }: DonateDialogProps) {
  const { user } = useAuth();
  const createDonation = useCreateDonation();
  const uploadReceipt = useUploadReceipt();
  
  const [step, setStep] = useState<'form' | 'pix' | 'receipt' | 'success'>('form');
  const [anonymous, setAnonymous] = useState(false);
  const [copied, setCopied] = useState(false);
  const [donation, setDonation] = useState<Donation | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!basket) return null;

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${PIX_KEY}5204000053039865802BR5925${PIX_NAME.substring(0, 25)}6009SAO PAULO62070503***6304`;
  
  const pixDescription = campaign 
    ? `Doação ${basket.title} – ${campaign.title} – Castle Movement`
    : `Doação ${basket.title} – Castle Movement`;

  const handleStartDonation = async () => {
    try {
      const result = await createDonation.mutateAsync({
        basket_type: basket.type,
        campaign_id: campaign?.id,
        amount: Number(basket.price),
        anonymous,
        donor_name: user?.user_metadata?.name
      });
      
      setDonation(result);
      setStep('pix');
    } catch (error) {
      toast.error('Erro ao iniciar doação');
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    toast.success('Chave PIX copiada!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !donation) return;
    
    setUploading(true);
    try {
      await uploadReceipt.mutateAsync({
        donationId: donation.id,
        file: receiptFile
      });
      setStep('success');
    } catch (error) {
      toast.error('Erro ao enviar comprovante');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setAnonymous(false);
    setCopied(false);
    setDonation(null);
    setReceiptFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' && 'Confirmar Doação'}
            {step === 'pix' && 'Pagar com PIX'}
            {step === 'receipt' && 'Enviar Comprovante'}
            {step === 'success' && 'Doação Registrada!'}
          </DialogTitle>
        </DialogHeader>

        {/* Step: Form */}
        {step === 'form' && (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">{basket.title}</p>
                  {campaign && (
                    <p className="text-sm text-muted-foreground">{campaign.title}</p>
                  )}
                </div>
                <p className="text-2xl font-bold text-primary">
                  R$ {Number(basket.price).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="anonymous"
                checked={anonymous}
                onCheckedChange={(checked) => setAnonymous(checked === true)}
              />
              <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                Quero doar de forma anônima
              </Label>
            </div>

            {anonymous && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Sua doação será registrada como "Anônimo" e não será vinculada à sua conta.
                </p>
              </div>
            )}

            <Button 
              onClick={handleStartDonation} 
              className="w-full btn-gradient"
              disabled={createDonation.isPending}
            >
              {createDonation.isPending ? 'Processando...' : 'Continuar para Pagamento'}
            </Button>
          </div>
        )}

        {/* Step: PIX */}
        {step === 'pix' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-48 h-48 bg-muted rounded-xl flex items-center justify-center">
                <QrCode className="w-32 h-32 text-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code ou copie a chave PIX
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Chave PIX (Email)</p>
                <p className="font-mono text-sm break-all">{PIX_KEY}</p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Valor</p>
                <p className="font-bold text-lg">R$ {Number(basket.price).toFixed(2)}</p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm">{pixDescription}</p>
              </div>
            </div>

            <Button 
              onClick={handleCopyPix} 
              variant="outline" 
              className="w-full"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Chave PIX
                </>
              )}
            </Button>

            <Button 
              onClick={() => setStep('receipt')} 
              className="w-full btn-gradient"
            >
              Já paguei
            </Button>
          </div>
        )}

        {/* Step: Receipt */}
        {step === 'receipt' && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Envie o comprovante de pagamento para confirmarmos sua doação.
            </p>

            <div className="space-y-3">
              <Label htmlFor="receipt">Comprovante (imagem ou PDF)</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>

            {receiptFile && (
              <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm truncate">{receiptFile.name}</span>
              </div>
            )}

            <Button 
              onClick={handleUploadReceipt} 
              className="w-full btn-gradient"
              disabled={!receiptFile || uploading}
            >
              {uploading ? (
                'Enviando...'
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Comprovante
                </>
              )}
            </Button>

            <Button 
              onClick={() => setStep('pix')} 
              variant="ghost" 
              className="w-full"
            >
              Voltar
            </Button>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground">Obrigado pela sua doação!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Seu comprovante foi enviado e está em análise. Você será notificado quando a doação for confirmada.
              </p>
            </div>

            {donation && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Código de referência</p>
                <p className="font-mono text-sm">{donation.reference_code}</p>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
