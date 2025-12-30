import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Target, 
  ClipboardList, 
  Plus, 
  Edit, 
  Check, 
  X, 
  Eye,
  Loader2,
  DollarSign,
  FileImage,
  CreditCard,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useBasketModels, 
  useDonationCampaigns, 
  useDonations, 
  useManageBasketModel, 
  useManageCampaign,
  useUpdateDonationStatus,
  useActivePaymentSettings
} from '@/hooks/useDonations';
import { Database } from '@/integrations/supabase/types';
import { PaymentSettingsDialog } from './PaymentSettingsDialog';

type BasketModel = Database['public']['Tables']['basket_models']['Row'];
type DonationCampaign = Database['public']['Tables']['donation_campaigns']['Row'];
type BasketType = Database['public']['Enums']['basket_type'];
type DonationStatus = Database['public']['Enums']['donation_status'];

const BASKET_LABELS = { P: 'Pequena', M: 'Média', G: 'Grande' };
const STATUS_LABELS = {
  pending: 'Pendente',
  reviewing: 'Em análise',
  confirmed: 'Confirmada',
  rejected: 'Rejeitada',
};
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// Basket Model Dialog
const BasketModelDialog = ({ basket, onClose }: { basket?: BasketModel; onClose: () => void }) => {
  const manageBasket = useManageBasketModel();
  const [title, setTitle] = useState(basket?.title || '');
  const [description, setDescription] = useState(basket?.description || '');
  const [type, setType] = useState<BasketType>(basket?.type || 'P');
  const [price, setPrice] = useState(basket?.price?.toString() || '');
  const [active, setActive] = useState(basket?.active ?? true);

  const handleSubmit = async () => {
    await manageBasket.mutateAsync({
      id: basket?.id,
      title,
      description,
      type,
      price: parseFloat(price),
      active,
    });
    onClose();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{basket ? 'Editar Cesta' : 'Nova Cesta'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Cesta Básica Pequena" />
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição da cesta..." />
        </div>
        {!basket && (
          <div className="space-y-2">
            <Label>Tamanho *</Label>
            <Select value={type} onValueChange={(v) => setType(v as BasketType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="P">Pequena (P)</SelectItem>
                <SelectItem value="M">Média (M)</SelectItem>
                <SelectItem value="G">Grande (G)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Valor (R$) *</Label>
          <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
        </div>
        <div className="flex items-center justify-between">
          <Label>Ativo</Label>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
        <Button onClick={handleSubmit} className="w-full" disabled={!title || !price || manageBasket.isPending}>
          {manageBasket.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
        </Button>
      </div>
    </DialogContent>
  );
};

// Campaign Dialog
const CampaignDialog = ({ campaign, onClose }: { campaign?: DonationCampaign; onClose: () => void }) => {
  const manageCampaign = useManageCampaign();
  const [title, setTitle] = useState(campaign?.title || '');
  const [description, setDescription] = useState(campaign?.description || '');
  const [goalAmount, setGoalAmount] = useState(campaign?.goal_amount?.toString() || '');
  const [goalBaskets, setGoalBaskets] = useState(campaign?.goal_baskets?.toString() || '');
  const [active, setActive] = useState(campaign?.active ?? true);
  const [endDate, setEndDate] = useState(campaign?.end_date?.split('T')[0] || '');

  const handleSubmit = async () => {
    await manageCampaign.mutateAsync({
      id: campaign?.id,
      title,
      description,
      goal_amount: goalAmount ? parseFloat(goalAmount) : undefined,
      goal_baskets: goalBaskets ? parseInt(goalBaskets) : undefined,
      active,
      end_date: endDate || undefined,
    });
    onClose();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{campaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Natal Solidário 2024" />
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição da campanha..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Meta financeira (R$)</Label>
            <Input type="number" step="0.01" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>Meta de cestas</Label>
            <Input type="number" value={goalBaskets} onChange={(e) => setGoalBaskets(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Data de encerramento</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <Label>Campanha ativa</Label>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
        <Button onClick={handleSubmit} className="w-full" disabled={!title || manageCampaign.isPending}>
          {manageCampaign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
        </Button>
      </div>
    </DialogContent>
  );
};

// Receipt Viewer Dialog
const ReceiptDialog = ({ url }: { url: string }) => {
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Comprovante</DialogTitle>
      </DialogHeader>
      <div className="flex justify-center">
        <img src={url} alt="Comprovante" className="max-h-96 object-contain rounded-lg" />
      </div>
    </DialogContent>
  );
};

export const AdminPanel = () => {
  const { data: baskets, isLoading: loadingBaskets } = useBasketModels();
  const { data: campaigns, isLoading: loadingCampaigns } = useDonationCampaigns();
  const { data: donations, isLoading: loadingDonations } = useDonations(undefined, true);
  const { data: paymentSettings } = useActivePaymentSettings();
  const updateStatus = useUpdateDonationStatus();

  const [editingBasket, setEditingBasket] = useState<BasketModel | null>(null);
  const [showNewBasket, setShowNewBasket] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<DonationCampaign | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);

  const stats = {
    totalAmount: donations?.filter(d => d.status === 'confirmed').reduce((sum, d) => sum + Number(d.amount), 0) || 0,
    totalPending: donations?.filter(d => d.status === 'pending' || d.status === 'reviewing').length || 0,
    totalConfirmed: donations?.filter(d => d.status === 'confirmed').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Arrecadado</p>
                <p className="text-xl font-bold">R$ {stats.totalAmount.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <ClipboardList className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold">{stats.totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmadas</p>
                <p className="text-xl font-bold">{stats.totalConfirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Settings Card */}
      <Card className={!paymentSettings?.is_active ? 'border-yellow-200 bg-yellow-50/50' : ''}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${paymentSettings?.is_active ? 'bg-primary/10' : 'bg-yellow-100'}`}>
                <CreditCard className={`w-5 h-5 ${paymentSettings?.is_active ? 'text-primary' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="font-medium">Configurações de Pagamento</p>
                <p className="text-sm text-muted-foreground">
                  {paymentSettings?.receiver_name ? (
                    <>PIX: {paymentSettings.pix_key}</>
                  ) : (
                    'Nenhum dado configurado'
                  )}
                </p>
                {!paymentSettings?.is_active && (
                  <Badge variant="outline" className="mt-1 text-yellow-600 border-yellow-300">
                    Pagamentos desativados
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPaymentSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaymentSettingsDialog open={showPaymentSettings} onOpenChange={setShowPaymentSettings} />

      <Tabs defaultValue="donations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="donations">Doações</TabsTrigger>
          <TabsTrigger value="baskets">Cestas</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
        </TabsList>

        {/* Donations Tab */}
        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerenciar Doações</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDonations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : donations?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma doação registrada</p>
              ) : (
                <div className="space-y-3">
                  {donations?.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {donation.anonymous ? 'Anônimo' : donation.donor_name || 'Doador'}
                          </span>
                          <Badge className={STATUS_COLORS[donation.status as keyof typeof STATUS_COLORS]}>
                            {STATUS_LABELS[donation.status as keyof typeof STATUS_LABELS]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Cesta {BASKET_LABELS[donation.basket_type]} • R$ {Number(donation.amount).toFixed(2).replace('.', ',')}
                          {donation.campaign && ` • ${donation.campaign.title}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(donation.created_at || ''), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {donation.receipt_url && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FileImage className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <ReceiptDialog url={donation.receipt_url} />
                          </Dialog>
                        )}
                        {(donation.status === 'pending' || donation.status === 'reviewing') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600"
                              onClick={() => updateStatus.mutate({ donationId: donation.id, status: 'confirmed' })}
                              disabled={updateStatus.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => updateStatus.mutate({ donationId: donation.id, status: 'rejected' })}
                              disabled={updateStatus.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Baskets Tab */}
        <TabsContent value="baskets" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showNewBasket} onOpenChange={setShowNewBasket}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Cesta
                </Button>
              </DialogTrigger>
              <BasketModelDialog onClose={() => setShowNewBasket(false)} />
            </Dialog>
          </div>

          <div className="grid gap-4">
            {loadingBaskets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              baskets?.map((basket) => (
                <Card key={basket.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{basket.title}</span>
                            <Badge variant={basket.active ? 'default' : 'secondary'}>
                              {basket.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Tipo {basket.type} • R$ {Number(basket.price).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                      <Dialog open={editingBasket?.id === basket.id} onOpenChange={(open) => !open && setEditingBasket(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingBasket(basket)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        {editingBasket?.id === basket.id && (
                          <BasketModelDialog basket={basket} onClose={() => setEditingBasket(null)} />
                        )}
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Campanha
                </Button>
              </DialogTrigger>
              <CampaignDialog onClose={() => setShowNewCampaign(false)} />
            </Dialog>
          </div>

          <div className="grid gap-4">
            {loadingCampaigns ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : campaigns?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma campanha criada
                </CardContent>
              </Card>
            ) : (
              campaigns?.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{campaign.title}</span>
                            <Badge variant={campaign.active ? 'default' : 'secondary'}>
                              {campaign.active ? 'Ativa' : 'Encerrada'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {campaign.goal_amount && `Meta: R$ ${Number(campaign.goal_amount).toFixed(2).replace('.', ',')}`}
                            {campaign.goal_baskets && ` • ${campaign.goal_baskets} cestas`}
                          </p>
                        </div>
                      </div>
                      <Dialog open={editingCampaign?.id === campaign.id} onOpenChange={(open) => !open && setEditingCampaign(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingCampaign(campaign)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        {editingCampaign?.id === campaign.id && (
                          <CampaignDialog campaign={campaign} onClose={() => setEditingCampaign(null)} />
                        )}
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
