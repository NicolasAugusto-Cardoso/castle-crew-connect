import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, DollarSign, Target, Users } from 'lucide-react';
import { useTransparencyStats, useConfirmedDonations, useDonationCampaigns } from '@/hooks/useDonations';

const BASKET_LABELS = {
  P: 'Econômica',
  M: 'Clássica',
  G: 'Master',
};

export const TransparencySection = () => {
  const { data: stats, isLoading: loadingStats } = useTransparencyStats();
  const { data: donations, isLoading: loadingDonations } = useConfirmedDonations();
  const { data: campaigns } = useDonationCampaigns();

  const activeCampaigns = campaigns?.filter(c => c.active) || [];
  const completedCampaigns = campaigns?.filter(c => !c.active) || [];

  if (loadingStats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Total Arrecadado</p>
                <p className="text-2xl font-bold">
                  R$ {(stats?.totalAmount || 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Cestas Doadas</p>
                <p className="text-2xl font-bold">{stats?.totalBaskets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Baskets by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Cestas por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {(['P', 'M', 'G'] as const).map((type) => (
              <div key={type} className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {stats?.basketsByType[type] || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {BASKET_LABELS[type]}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Summary */}
      {(activeCampaigns.length > 0 || completedCampaigns.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Campanhas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCampaigns.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Ativas</h4>
                <div className="space-y-2">
                  {activeCampaigns.map((campaign) => (
                    <div 
                      key={campaign.id} 
                      className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200"
                    >
                      <span className="font-medium text-green-800">{campaign.title}</span>
                      <span className="text-sm text-green-600">Em andamento</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedCampaigns.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Encerradas</h4>
                <div className="space-y-2">
                  {completedCampaigns.slice(0, 3).map((campaign) => (
                    <div 
                      key={campaign.id} 
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="font-medium">{campaign.title}</span>
                      <span className="text-sm text-muted-foreground">Concluída</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Donations */}
      {donations && donations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Últimas Doações Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {donations.slice(0, 10).map((donation) => (
                <div 
                  key={donation.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {donation.anonymous ? 'Anônimo' : donation.donor_name || 'Doador'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cesta {BASKET_LABELS[donation.basket_type as keyof typeof BASKET_LABELS]}
                      {donation.campaign && ` • ${donation.campaign.title}`}
                    </p>
                  </div>
                  <span className="font-semibold text-primary">
                    R$ {Number(donation.amount).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transparency Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800 text-center">
            Todas as doações são registradas de forma transparente. Os recursos são utilizados 
            exclusivamente para fins sociais, com prestação de contas pública.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
