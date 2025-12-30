import { TrendingUp, Package, Target, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DonationCampaign } from '@/hooks/useDonations';

interface TransparencySectionProps {
  stats: {
    totalAmount: number;
    totalBaskets: number;
    byType: { P: number; M: number; G: number };
    byCampaign: Record<string, { amount: number; count: number }>;
  } | undefined;
  campaigns: DonationCampaign[];
}

export function TransparencySection({ stats, campaigns }: TransparencySectionProps) {
  const basketLabels = {
    P: 'Pequenas',
    M: 'Médias',
    G: 'Grandes'
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm text-foreground">
          <strong>Transparência e Impacto Social:</strong> Todos os valores exibidos aqui são de doações <strong>confirmadas</strong>. 
          Nosso compromisso é utilizar cada doação de forma responsável e alinhada ao propósito social do Castle Movement.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">
              R$ {stats?.totalAmount.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground">Total Arrecadado</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-2">
              <Package className="w-6 h-6 text-accent" />
            </div>
            <p className="text-2xl font-bold text-accent">
              {stats?.totalBaskets || 0}
            </p>
            <p className="text-xs text-muted-foreground">Cestas Doadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Por Tipo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-5 h-5" />
            Por Tipo de Cesta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(['P', 'M', 'G'] as const).map((type) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{type}</Badge>
                <span className="text-sm text-foreground">{basketLabels[type]}</span>
              </div>
              <span className="font-semibold text-foreground">
                {stats?.byType[type] || 0}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Campanhas */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5" />
              Campanhas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.map((campaign) => {
              const campaignStats = stats?.byCampaign[campaign.id];
              const progress = campaign.goal_amount && campaignStats
                ? (campaignStats.amount / campaign.goal_amount) * 100
                : 0;

              return (
                <div key={campaign.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{campaign.title}</span>
                      {campaign.active && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Ativa
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      R$ {campaignStats?.amount.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  {campaign.goal_amount && (
                    <>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{Math.round(progress)}% da meta</span>
                        <span>Meta: R$ {campaign.goal_amount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {campaignStats && (
                    <p className="text-xs text-muted-foreground">
                      {campaignStats.count} cesta{campaignStats.count !== 1 ? 's' : ''} doada{campaignStats.count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Última atualização */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CheckCircle className="w-4 h-4" />
        <span>Dados atualizados em tempo real</span>
      </div>
    </div>
  );
}
