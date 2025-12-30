import { useState } from 'react';
import { 
  Settings, 
  TrendingUp, 
  Package, 
  CheckCircle, 
  XCircle, 
  Eye,
  Clock,
  Target,
  Edit,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { 
  useAllDonations, 
  useAllBasketModels,
  useAllCampaigns,
  useDonationStats,
  useUpdateDonationStatus,
  useManageBasketModels,
  useManageCampaigns,
  Donation,
  BasketModel,
  DonationCampaign
} from '@/hooks/useDonations';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  reviewing: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700', icon: Eye },
  confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-700', icon: XCircle }
};

export default function DonationsAdmin() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);
  
  const { data: donations, isLoading } = useAllDonations();
  const { data: baskets } = useAllBasketModels();
  const { data: campaigns } = useAllCampaigns();
  const { data: stats } = useDonationStats();
  const updateStatus = useUpdateDonationStatus();
  const { updateModel } = useManageBasketModels();
  const { createCampaign, updateCampaign } = useManageCampaigns();

  const [editingBasket, setEditingBasket] = useState<BasketModel | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<DonationCampaign | null>(null);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Form states
  const [basketPrice, setBasketPrice] = useState('');
  const [basketActive, setBasketActive] = useState(true);
  
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [campaignActive, setCampaignActive] = useState(true);

  const handleConfirmDonation = (donationId: string) => {
    updateStatus.mutate({ donationId, status: 'confirmed' });
  };

  const handleRejectDonation = (donationId: string) => {
    updateStatus.mutate({ donationId, status: 'rejected' });
  };

  const handleEditBasket = (basket: BasketModel) => {
    setEditingBasket(basket);
    setBasketPrice(basket.price.toString());
    setBasketActive(basket.active);
  };

  const handleSaveBasket = () => {
    if (!editingBasket) return;
    updateModel.mutate({
      id: editingBasket.id,
      price: parseFloat(basketPrice),
      active: basketActive
    });
    setEditingBasket(null);
  };

  const handleNewCampaign = () => {
    setCampaignTitle('');
    setCampaignDescription('');
    setCampaignGoal('');
    setCampaignActive(true);
    setNewCampaignOpen(true);
  };

  const handleEditCampaign = (campaign: DonationCampaign) => {
    setEditingCampaign(campaign);
    setCampaignTitle(campaign.title);
    setCampaignDescription(campaign.description || '');
    setCampaignGoal(campaign.goal_amount?.toString() || '');
    setCampaignActive(campaign.active);
  };

  const handleSaveCampaign = () => {
    const data = {
      title: campaignTitle,
      description: campaignDescription || null,
      goal_amount: campaignGoal ? parseFloat(campaignGoal) : null,
      active: campaignActive
    };

    if (editingCampaign) {
      updateCampaign.mutate({ id: editingCampaign.id, ...data });
      setEditingCampaign(null);
    } else {
      createCampaign.mutate(data as any);
      setNewCampaignOpen(false);
    }
  };

  const reviewingDonations = donations?.filter(d => d.status === 'reviewing') || [];
  const pendingDonations = donations?.filter(d => d.status === 'pending') || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Gestão de Doações</h1>
          <p className="text-sm text-muted-foreground">Gerencie doações, campanhas e cestas</p>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-xl font-bold text-primary">
              R$ {stats?.totalAmount.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground">Total Confirmado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 mx-auto text-accent mb-2" />
            <p className="text-xl font-bold text-accent">{stats?.totalBaskets || 0}</p>
            <p className="text-xs text-muted-foreground">Cestas Confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-xl font-bold text-blue-500">{reviewingDonations.length}</p>
            <p className="text-xs text-muted-foreground">Em Análise</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-xl font-bold text-amber-500">{pendingDonations.length}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviewing" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reviewing">Em Análise</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
          {isAdmin && <TabsTrigger value="baskets">Cestas</TabsTrigger>}
          {isAdmin && <TabsTrigger value="campaigns">Campanhas</TabsTrigger>}
        </TabsList>

        {/* Em Análise */}
        <TabsContent value="reviewing" className="mt-4 space-y-4">
          {reviewingDonations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma doação aguardando análise
              </CardContent>
            </Card>
          ) : (
            reviewingDonations.map((donation) => (
              <DonationCard 
                key={donation.id}
                donation={donation}
                onConfirm={() => handleConfirmDonation(donation.id)}
                onReject={() => handleRejectDonation(donation.id)}
                onViewReceipt={() => setSelectedReceipt(donation.receipt_url)}
              />
            ))
          )}
        </TabsContent>

        {/* Todas */}
        <TabsContent value="all" className="mt-4 space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center">Carregando...</CardContent></Card>
          ) : donations?.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma doação</CardContent></Card>
          ) : (
            donations?.map((donation) => (
              <DonationCard 
                key={donation.id}
                donation={donation}
                onConfirm={() => handleConfirmDonation(donation.id)}
                onReject={() => handleRejectDonation(donation.id)}
                onViewReceipt={() => setSelectedReceipt(donation.receipt_url)}
                showActions={donation.status === 'reviewing'}
              />
            ))
          )}
        </TabsContent>

        {/* Cestas (Admin) */}
        {isAdmin && (
          <TabsContent value="baskets" className="mt-4 space-y-4">
            {baskets?.map((basket) => (
              <Card key={basket.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{basket.title}</h3>
                      <Badge variant={basket.active ? 'default' : 'secondary'}>
                        {basket.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-primary">R$ {Number(basket.price).toFixed(2)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleEditBasket(basket)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* Campanhas (Admin) */}
        {isAdmin && (
          <TabsContent value="campaigns" className="mt-4 space-y-4">
            <Button onClick={handleNewCampaign} className="w-full btn-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
            
            {campaigns?.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{campaign.title}</h3>
                        <Badge variant={campaign.active ? 'default' : 'secondary'}>
                          {campaign.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                      )}
                      {campaign.goal_amount && (
                        <p className="text-sm mt-2">Meta: R$ {campaign.goal_amount.toFixed(2)}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEditCampaign(campaign)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog Editar Cesta */}
      <Dialog open={!!editingBasket} onOpenChange={() => setEditingBasket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {editingBasket?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Preço (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={basketPrice} 
                onChange={(e) => setBasketPrice(e.target.value)} 
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={basketActive} onCheckedChange={setBasketActive} />
              <Label>Ativo</Label>
            </div>
            <Button onClick={handleSaveBasket} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Campanha */}
      <Dialog 
        open={!!editingCampaign || newCampaignOpen} 
        onOpenChange={() => { setEditingCampaign(null); setNewCampaignOpen(false); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={campaignDescription} onChange={(e) => setCampaignDescription(e.target.value)} />
            </div>
            <div>
              <Label>Meta (R$) - Opcional</Label>
              <Input type="number" step="0.01" value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={campaignActive} onCheckedChange={setCampaignActive} />
              <Label>Ativa</Label>
            </div>
            <Button onClick={handleSaveCampaign} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Comprovante */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprovante</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <img src={selectedReceipt} alt="Comprovante" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente auxiliar para card de doação
function DonationCard({ 
  donation, 
  onConfirm, 
  onReject, 
  onViewReceipt,
  showActions = true 
}: { 
  donation: Donation;
  onConfirm: () => void;
  onReject: () => void;
  onViewReceipt: () => void;
  showActions?: boolean;
}) {
  const status = statusConfig[donation.status];
  const StatusIcon = status.icon;
  
  const basketLabels = { P: 'Pequena', M: 'Média', G: 'Grande' };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">Cesta {basketLabels[donation.basket_type]}</span>
              <Badge className={status.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              {donation.anonymous && <Badge variant="secondary">Anônima</Badge>}
            </div>
            
            <p className="text-lg font-bold text-primary">R$ {Number(donation.amount).toFixed(2)}</p>
            
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <p>Doador: {donation.donor_name || 'Não informado'}</p>
              <p>Ref: {donation.reference_code}</p>
              <p>{format(new Date(donation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {donation.receipt_url && (
              <Button size="sm" variant="outline" onClick={onViewReceipt}>
                <Eye className="w-4 h-4" />
              </Button>
            )}
            
            {showActions && donation.status === 'reviewing' && (
              <>
                <Button size="sm" variant="default" onClick={onConfirm}>
                  <CheckCircle className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={onReject}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
