import { useState } from 'react';
import { Heart, Package, ChevronRight, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { 
  useBasketModels, 
  useActiveCampaigns, 
  useUserDonations,
  useDonationStats,
  DonationCampaign,
  BasketModel
} from '@/hooks/useDonations';
import { DonateDialog } from '@/components/donations/DonateDialog';
import { TransparencySection } from '@/components/donations/TransparencySection';
import { MyDonations } from '@/components/donations/MyDonations';

export default function Donations() {
  const { hasRole } = useAuth();
  const { data: baskets, isLoading: loadingBaskets } = useBasketModels();
  const { data: campaigns } = useActiveCampaigns();
  const { data: userDonations } = useUserDonations();
  const { data: stats } = useDonationStats();
  
  const [selectedBasket, setSelectedBasket] = useState<BasketModel | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);

  const handleDonate = (basket: BasketModel, campaign?: DonationCampaign) => {
    setSelectedBasket(basket);
    setSelectedCampaign(campaign || null);
    setDonateDialogOpen(true);
  };

  const basketSizeLabel = {
    P: 'Pequena',
    M: 'Média', 
    G: 'Grande'
  };

  const basketColors = {
    P: 'bg-emerald-500',
    M: 'bg-primary',
    G: 'bg-accent'
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Doações</h1>
            <p className="text-sm text-muted-foreground">Doe cestas básicas e transforme vidas</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="donate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="donate">Doar</TabsTrigger>
          <TabsTrigger value="my-donations">Minhas Doações</TabsTrigger>
          <TabsTrigger value="transparency">Transparência</TabsTrigger>
        </TabsList>

        {/* Tab Doar */}
        <TabsContent value="donate" className="space-y-6 mt-4">
          {/* Campanhas Ativas */}
          {campaigns && campaigns.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Campanhas Ativas
              </h2>
              <div className="grid gap-3">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                          )}
                          {campaign.goal_amount && stats?.byCampaign[campaign.id] && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Meta: R$ {campaign.goal_amount.toFixed(2)}</span>
                                <span>•</span>
                                <span>Arrecadado: R$ {stats.byCampaign[campaign.id].amount.toFixed(2)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2 mt-1">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ 
                                    width: `${Math.min(100, (stats.byCampaign[campaign.id].amount / campaign.goal_amount) * 100)}%` 
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Modelos de Cesta */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Escolha sua Cesta</h2>
            
            {loadingBaskets ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 h-32 bg-muted/50" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {baskets?.map((basket) => (
                  <Card 
                    key={basket.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => handleDonate(basket, campaigns?.[0])}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Color indicator */}
                        <div className={`w-2 ${basketColors[basket.type]}`} />
                        
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${basketColors[basket.type]}/10`}>
                              <Package className={`w-8 h-8 ${basketColors[basket.type].replace('bg-', 'text-')}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-foreground">{basket.title}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {basketSizeLabel[basket.type]}
                                </Badge>
                              </div>
                              {basket.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {basket.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              R$ {Number(basket.price).toFixed(2)}
                            </p>
                            <Button 
                              size="sm" 
                              className="mt-2 btn-gradient"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDonate(basket, campaigns?.[0]);
                              }}
                            >
                              Doar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Minhas Doações */}
        <TabsContent value="my-donations" className="mt-4">
          <MyDonations donations={userDonations || []} />
        </TabsContent>

        {/* Tab Transparência */}
        <TabsContent value="transparency" className="mt-4">
          <TransparencySection stats={stats} campaigns={campaigns || []} />
        </TabsContent>
      </Tabs>

      {/* Dialog de Doação */}
      <DonateDialog
        open={donateDialogOpen}
        onOpenChange={setDonateDialogOpen}
        basket={selectedBasket}
        campaign={selectedCampaign}
      />
    </div>
  );
}
