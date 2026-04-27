import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBasketModels, useDonationCampaigns } from '@/hooks/useDonations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Eye, Settings, Loader2, Package } from 'lucide-react';
import { BasketCard } from '@/components/donations/BasketCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { DonationDialog } from '@/components/donations/DonationDialog';
import { TransparencySection } from '@/components/donations/TransparencySection';
import { AdminPanel } from '@/components/donations/AdminPanel';
import { SectionHeading } from '@/components/ui/section-heading';
import { getSectionTheme } from '@/lib/colorThemes';
import { Database } from '@/integrations/supabase/types';

type BasketModel = Database['public']['Tables']['basket_models']['Row'];

export default function Donations() {
  const { user, hasRole } = useAuth();
  const { data: baskets, isLoading: loadingBaskets } = useBasketModels();
  const { data: campaigns } = useDonationCampaigns(true);

  const [selectedBasket, setSelectedBasket] = useState<BasketModel | null>(null);
  const [showDonationDialog, setShowDonationDialog] = useState(false);

  const isAdmin = hasRole(['admin']);
  const activeBaskets = baskets?.filter(b => b.active) || [];

  const handleSelectBasket = (basket: BasketModel) => {
    setSelectedBasket(basket);
    setShowDonationDialog(true);
  };

  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6 text-center">
        <SectionHeading colorTheme={getSectionTheme('donations')} as="h1" icon={<Heart className="w-6 h-6" />}>
          Doações
        </SectionHeading>
        <p className="text-sm xs:text-base text-muted-foreground">
          Doe cestas básicas e ajude famílias em necessidade
        </p>
      </div>

      <Tabs defaultValue="donate" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="donate" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden xs:inline">Doar</span>
          </TabsTrigger>
          <TabsTrigger value="transparency" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden xs:inline">Transparência</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden xs:inline">Gerenciar</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Donate Tab */}
        <TabsContent value="donate" className="space-y-6 mt-6">
          {/* Active Campaigns */}
          {campaigns && campaigns.length > 0 && (
            <div className="space-y-4">
              <SectionHeading
                colorTheme={getSectionTheme('donations')}
                as="h2"
                icon={<Package className="w-5 h-5" />}
              >
                Campanhas Ativas
              </SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2">
                {campaigns.map((campaign, idx) => (
                  <CampaignCard key={campaign.id} campaign={campaign} index={idx} />
                ))}
              </div>
            </div>
          )}

          {/* Basket Selection */}
          <div className="space-y-4">
            <SectionHeading
              colorTheme={getSectionTheme('donations')}
              as="h2"
              icon={<Package className="w-5 h-5" />}
            >
              Escolha uma Cesta
            </SectionHeading>

            {loadingBaskets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : activeBaskets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma cesta disponível no momento</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeBaskets.map((basket, idx) => (
                  <BasketCard
                    key={basket.id}
                    basket={basket}
                    onSelect={handleSelectBasket}
                    selected={selectedBasket?.id === basket.id}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Donation CTA */}
          <Card className="bg-gradient-to-r from-primary to-primary-dark text-white">
            <CardContent className="py-6 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-lg font-semibold mb-2">Faça a diferença</h3>
              <p className="text-sm text-white/80 mb-4">
                Sua doação ajuda famílias em situação de vulnerabilidade a terem acesso a alimentos básicos.
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => setShowDonationDialog(true)}
              >
                <Heart className="w-4 h-4 mr-2" />
                Doar Agora
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-800">
                <strong>Como funciona:</strong> Todas as doações são realizadas via PIX diretamente 
                no seu aplicativo bancário. O Castle Movement não armazena dados bancários. 
                Você pode acompanhar a transparência das doações a qualquer momento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transparency Tab */}
        <TabsContent value="transparency" className="mt-6">
          <TransparencySection />
        </TabsContent>

        {/* Admin Tab */}
        {isAdmin && (
          <TabsContent value="admin" className="mt-6">
            <AdminPanel />
          </TabsContent>
        )}
      </Tabs>

      {/* Donation Dialog */}
      <DonationDialog
        open={showDonationDialog}
        onOpenChange={setShowDonationDialog}
        selectedBasket={selectedBasket}
      />
    </div>
  );
}
