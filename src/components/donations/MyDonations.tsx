import { useState } from 'react';
import { Clock, CheckCircle, XCircle, Eye, Upload, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Donation, useUploadReceipt } from '@/hooks/useDonations';
import { toast } from 'sonner';

interface MyDonationsProps {
  donations: Donation[];
}

const statusConfig = {
  pending: {
    label: 'Aguardando',
    icon: Clock,
    color: 'bg-amber-100 text-amber-700 border-amber-200'
  },
  reviewing: {
    label: 'Em Análise',
    icon: Eye,
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  confirmed: {
    label: 'Confirmada',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  rejected: {
    label: 'Rejeitada',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-200'
  }
};

const basketLabels = {
  P: 'Cesta Pequena',
  M: 'Cesta Média',
  G: 'Cesta Grande'
};

export function MyDonations({ donations }: MyDonationsProps) {
  const uploadReceipt = useUploadReceipt();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!receiptFile || !selectedDonation) return;

    setUploadingId(selectedDonation.id);
    try {
      await uploadReceipt.mutateAsync({
        donationId: selectedDonation.id,
        file: receiptFile
      });
      setSelectedDonation(null);
      setReceiptFile(null);
    } catch (error) {
      toast.error('Erro ao enviar comprovante');
    } finally {
      setUploadingId(null);
    }
  };

  if (donations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Nenhuma doação ainda</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Suas doações aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {donations.map((donation) => {
        const status = statusConfig[donation.status];
        const StatusIcon = status.icon;

        return (
          <Card key={donation.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {basketLabels[donation.basket_type]}
                    </h3>
                    <Badge className={status.color} variant="outline">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <p className="text-lg font-bold text-primary">
                    R$ {Number(donation.amount).toFixed(2)}
                  </p>

                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Ref: {donation.reference_code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(donation.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  {donation.anonymous && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Anônima
                    </Badge>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2">
                  {donation.status === 'pending' && !donation.receipt_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDonation(donation)}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Comprovante
                    </Button>
                  )}

                  {donation.receipt_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <a href={donation.receipt_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Dialog Upload */}
      <Dialog open={!!selectedDonation} onOpenChange={() => setSelectedDonation(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Comprovante</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie o comprovante de pagamento para confirmarmos sua doação.
            </p>

            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />

            {receiptFile && (
              <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm truncate">{receiptFile.name}</span>
              </div>
            )}

            <Button
              onClick={handleUpload}
              className="w-full btn-gradient"
              disabled={!receiptFile || uploadingId === selectedDonation?.id}
            >
              {uploadingId === selectedDonation?.id ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
